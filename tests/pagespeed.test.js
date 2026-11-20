import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeUrl, summarize, psiEndpoint } from '../functions/_lib/pagespeed.js'

test('normalizeUrl accepts ordinary public sites and adds https', () => {
  assert.equal(normalizeUrl('yourlodge.co.ke'), 'https://yourlodge.co.ke/')
  assert.equal(normalizeUrl('  https://www.hotel.com/rooms?x=1#top '), 'https://www.hotel.com/rooms?x=1')
  assert.equal(normalizeUrl('http://hotel.co.ke'), 'http://hotel.co.ke/')
})

test('normalizeUrl refuses anything that is not a public website', () => {
  for (const bad of ['', 'localhost', 'http://127.0.0.1', '10.0.0.1', 'http://192.168.1.1/x', 'intranet', 'my.local', 'ftp://a.com', 'javascript:alert(1)',
    'https://user:pass@a.com', 'a.com:8080', 'a b.com', 'x'.repeat(300) + '.com', 'http://[::1]/', 'router.internal', 'site.example']) {
    assert.equal(normalizeUrl(bad), null, bad)
  }
})

const report = {
  lighthouseResult: {
    finalDisplayedUrl: 'https://a.com/',
    categories: {
      performance: { score: 0.41, auditRefs: [{ id: 'largest-contentful-paint', weight: 25 }, { id: 'total-blocking-time', weight: 30 }, { id: 'speed-index', weight: 10 }, { id: 'ok', weight: 35 }] },
      seo: { score: 0.82, auditRefs: [{ id: 'meta-description', weight: 1 }, { id: 'document-title', weight: 1 }] },
      accessibility: { score: 0.9, auditRefs: [{ id: 'image-alt', weight: 10 }] },
    },
    audits: {
      'largest-contentful-paint': { score: 0.1, displayValue: '7.2 s', scoreDisplayMode: 'numeric', title: 'LCP' },
      'total-blocking-time': { score: 0.3, displayValue: '900 ms', scoreDisplayMode: 'numeric' },
      'speed-index': { score: 0.95, scoreDisplayMode: 'numeric' },
      ok: { score: 1, scoreDisplayMode: 'numeric' },
      'meta-description': { score: 0, scoreDisplayMode: 'binary', title: 'Document does not have a meta description' },
      'document-title': { score: 1, scoreDisplayMode: 'binary' },
      'image-alt': { score: 0.5, scoreDisplayMode: 'numeric' },
      'cumulative-layout-shift': { displayValue: '0.3' },
    },
  },
}

test('summarize gives three scores, timings and at most three findings ranked by points lost', () => {
  const s = summarize(report)
  assert.deepEqual(s.scores, { performance: 41, seo: 82, accessibility: 90 })
  assert.equal(s.metrics.lcp, '7.2 s')
  assert.equal(s.issues.length, 3)
  assert.equal(s.issues[0].id, 'largest-contentful-paint') // 22 points, and speed ranks first
  assert.equal(s.issues[0].points, 23)
  assert.ok(s.issues.some((i) => i.area === 'performance'))
  assert.ok(!s.issues.some((i) => i.id === 'ok' || i.id === 'speed-index' || i.id === 'document-title'))
})

test('summarize returns null for a report it cannot read', () => {
  assert.equal(summarize({}), null)
  assert.equal(summarize({ lighthouseResult: { categories: {}, audits: {} } }), null)
})

test('psiEndpoint asks for a mobile run with the three categories and an optional key', () => {
  const u = new URL(psiEndpoint('https://a.com/', 'K'))
  assert.equal(u.searchParams.get('strategy'), 'mobile')
  assert.deepEqual(u.searchParams.getAll('category'), ['performance', 'seo', 'accessibility'])
  assert.equal(u.searchParams.get('key'), 'K')
  assert.equal(new URL(psiEndpoint('https://a.com/')).searchParams.has('key'), false)
})
