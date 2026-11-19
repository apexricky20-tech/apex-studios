import test from 'node:test'
import assert from 'node:assert/strict'
import { loaders, routeKeyFor } from '../src/lib/routes.js'

test('routeKeyFor maps every listed page to a loader that exists', () => {
  for (const p of ['/work', '/services', '/website-design', '/google-business-profile', '/development', '/automation', '/branding', '/mpesa-payments', '/whatsapp-automation', '/ai-assistant', '/care-plans', '/3d-creation', '/ui-ux-design', '/motion-design', '/process', '/about', '/contact', '/articles', '/privacy', '/terms', '/refer']) {
    const key = routeKeyFor(p)
    assert.ok(key, `${p} has no loader key`)
    assert.equal(typeof loaders[key], 'function', `${p} -> ${key} has no loader`)
  }
})

test('routeKeyFor handles dynamic pages, trailing slashes, queries and hashes', () => {
  assert.equal(routeKeyFor('/work/bullhead'), 'project')
  assert.equal(routeKeyFor('/articles/local-seo-basics'), 'article')
  assert.equal(routeKeyFor('/contact/'), 'contact')
  assert.equal(routeKeyFor('/contact?offer=free-check'), 'contact')
  assert.equal(routeKeyFor('/process#top'), 'process')
})

test('routeKeyFor never warms the home page, the dashboard or unknown paths', () => {
  assert.equal(routeKeyFor('/'), null)
  assert.equal(routeKeyFor(''), null)
  assert.equal(routeKeyFor(undefined), null)
  assert.equal(routeKeyFor('/21'), null)
  assert.equal(routeKeyFor('/does-not-exist'), null)
})
