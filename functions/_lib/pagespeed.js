// Pure helpers for the free digital check (kept apart from the request handler so they can be tested).

// Turns what a visitor typed into a safe address to hand to Google, or null.
// Only public http(s) sites on a real domain name: no IP addresses, no localhost or internal names,
// no logins in the address, no odd ports. (Google fetches the page, not us, but we still refuse to ask.)
export function normalizeUrl(input) {
  let s = String(input ?? '').trim()
  if (!s || s.length > 200 || /\s/.test(s)) return null
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) s = `https://${s}`
  let u
  try {
    u = new URL(s)
  } catch {
    return null
  }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return null
  if (u.username || u.password) return null
  if (u.port && u.port !== '80' && u.port !== '443') return null
  const host = u.hostname.toLowerCase().replace(/\.$/, '')
  if (!host.includes('.') || host.startsWith('[') || /^[\d.]+$/.test(host)) return null
  if (/(^|\.)(localhost|local|internal|lan|home|corp|test|invalid|example)$/.test(host)) return null
  if (!/^[a-z0-9.-]+$/.test(host)) return null // the URL parser has already turned any accented name into plain xn-- letters
  u.hash = ''
  return u.href
}

// Plain-English names for the findings a hotel owner will actually see.
const PLAIN = {
  'largest-contentful-paint': 'The main picture or heading takes too long to appear',
  'first-contentful-paint': 'Visitors see a blank screen for too long',
  'total-blocking-time': 'The page freezes while it loads, so taps do nothing',
  'cumulative-layout-shift': 'Things jump around while the page loads',
  'speed-index': 'The page fills in slowly',
  'meta-description': 'Google has no description to show under your link',
  'document-title': 'The page has no title for Google',
  'image-alt': 'Pictures have no text description (hurts search and accessibility)',
  'color-contrast': 'Some text is hard to read against its background',
  'link-text': 'Links say things like "click here" instead of what they lead to',
  'is-crawlable': 'Google may be blocked from listing this page',
  viewport: 'The page is not set up properly for phones',
  'tap-targets': 'Buttons and links are too small to tap',
  'font-size': 'Text is too small to read on a phone',
  'uses-responsive-images': 'Pictures are bigger than the screen needs',
  'uses-optimized-images': 'Pictures could be compressed to load faster',
  'modern-image-formats': 'Pictures could use a lighter format',
  'render-blocking-resources': 'Files are holding the page back from showing',
  'unused-javascript': 'The page downloads code it never uses',
  'server-response-time': 'The server is slow to start answering',
  'errors-in-console': 'The page has errors behind the scenes',
  'uses-http2': 'The server uses an older, slower connection type',
}

const stripMd = (s) => String(s || '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/\s+/g, ' ').trim()

// Boils Google's very large report down to what we show: three scores, three timings, three findings.
export function summarize(psi) {
  const lh = psi?.lighthouseResult
  if (!lh?.categories || !lh?.audits) return null
  const cats = lh.categories
  const score = (k) => (typeof cats[k]?.score === 'number' ? Math.round(cats[k].score * 100) : null)
  const scores = { performance: score('performance'), seo: score('seo'), accessibility: score('accessibility') }
  if (scores.performance === null) return null

  const a = lh.audits
  const metric = (id) => a[id]?.displayValue || null
  const metrics = { lcp: metric('largest-contentful-paint'), tbt: metric('total-blocking-time'), cls: metric('cumulative-layout-shift') }

  // Points of a category's score that each failing check costs, so findings from different categories compare fairly.
  const found = []
  for (const key of ['performance', 'seo', 'accessibility']) {
    const refs = cats[key]?.auditRefs || []
    const total = refs.reduce((n, r) => n + (r.weight || 0), 0) || 1
    for (const r of refs) {
      const au = a[r.id]
      if (!au || !r.weight || typeof au.score !== 'number' || au.score >= 0.9) continue
      if (['notApplicable', 'manual', 'informative'].includes(au.scoreDisplayMode)) continue
      found.push({
        id: r.id,
        area: key,
        title: PLAIN[r.id] || stripMd(au.title),
        detail: au.displayValue ? stripMd(au.displayValue) : '',
        points: Math.round(((r.weight / total) * (1 - au.score)) * 100),
      })
    }
  }
  // Speed is the headline, so it ranks a little higher, and a speed finding is always shown when there is one.
  const rank = (f) => f.points * (f.area === 'performance' ? 1 : 0.4)
  found.sort((x, y) => rank(y) - rank(x))
  const real = found.filter((f) => f.points >= 1)
  const issues = real.slice(0, 3)
  const speed = real.find((f) => f.area === 'performance')
  if (speed && !issues.includes(speed)) issues[2] = speed
  return { url: lh.finalDisplayedUrl || lh.finalUrl || psi.id || '', scores, metrics, issues }
}

export const psiEndpoint = (href, key) => {
  const q = new URLSearchParams({ url: href, strategy: 'mobile' })
  for (const c of ['performance', 'seo', 'accessibility']) q.append('category', c)
  if (key) q.set('key', key)
  return `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${q}`
}
