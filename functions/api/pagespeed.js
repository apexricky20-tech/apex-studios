// Cloudflare Pages Function: POST /api/pagespeed  { url }
// The free digital check. Asks Google PageSpeed Insights to test the visitor's site on a simulated phone
// and returns a short summary. Google fetches the site, not us.
// Needs nothing extra to work. Optional: a PSI_API_KEY secret (free, from Google Cloud) raises Google's quota.
// Cost control: a result is cached for an hour per address (Cache API, no KV), and each check costs 2 KV
// writes at most (one per-visitor counter, one daily counter), so 100 checks a day = 200 of the 1,000 free writes.
import { json, sameOrigin, bump, HttpError } from '../_lib/shared.js'
import { normalizeUrl, summarize, psiEndpoint } from '../_lib/pagespeed.js'

const PER_IP_PER_HOUR = 4
const PER_DAY_TOTAL = 100

export async function onRequest({ request, env }) {
  const u = new URL(request.url)
  try {
    if (request.method !== 'POST') throw new HttpError(405, 'Use POST.')
    if (!sameOrigin(request, u)) throw new HttpError(403, 'Bad origin.')
    let body = {}
    try {
      body = await request.json()
    } catch {
      /* handled below as an invalid address */
    }
    const href = normalizeUrl(body?.url)
    if (!href) throw new HttpError(400, 'Enter your website address, for example yourlodge.co.ke')

    const cache = typeof caches !== 'undefined' ? caches.default : null
    const cacheKey = new Request(`https://check.cache.invalid/psi?u=${encodeURIComponent(href)}`)
    const hit = cache && (await cache.match(cacheKey))
    if (hit) return json(await hit.json())

    const ip = request.headers.get('CF-Connecting-IP') || 'local'
    if (env.DB) {
      if (!(await bump(env, `rl:psi:${ip}`, PER_IP_PER_HOUR, 3600))) throw new HttpError(429, 'You have run a few checks already. Please try again in an hour, or message us on WhatsApp and we will run it for you.')
      const day = new Date().toISOString().slice(0, 10)
      if (!(await bump(env, `rl:psi:day:${day}`, PER_DAY_TOTAL, 90000))) throw new HttpError(429, 'The free check is very busy today. Message us on WhatsApp and we will run it for you.')
    }

    let res
    try {
      res = await fetch(psiEndpoint(href, env.PSI_API_KEY), { signal: AbortSignal.timeout(40000) })
    } catch {
      throw new HttpError(504, 'That took too long to test. Try again in a moment.')
    }
    if (res.status === 429) throw new HttpError(503, 'Google is limiting free checks right now. Message us on WhatsApp and we will run it for you.')
    const data = await res.json().catch(() => null)
    if (!res.ok || data?.error) throw new HttpError(422, 'We could not open that website. Check the address, and that the site is online.')
    const out = summarize(data)
    if (!out) throw new HttpError(422, 'We could not read a result for that website.')
    out.url = href
    if (cache) await cache.put(cacheKey, new Response(JSON.stringify(out), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600' } }))
    return json(out)
  } catch (e) {
    if (e instanceof HttpError) return json({ error: e.message }, e.status)
    return json({ error: 'Something went wrong. Please try again.' }, 500)
  }
}
