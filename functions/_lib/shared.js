// Helpers shared by every Pages Function (kept in one place so the copies cannot drift apart).
const enc = new TextEncoder()

export class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

export const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers },
  })

export const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
export const randomHex = (n) => hex(crypto.getRandomValues(new Uint8Array(n)))
export const sha256 = async (s) => new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(s)))

export function safeEqual(a, b) {
  const x = typeof a === 'string' ? enc.encode(a) : a
  const y = typeof b === 'string' ? enc.encode(b) : b
  let diff = x.length ^ y.length
  const n = Math.max(x.length, y.length)
  for (let i = 0; i < n; i++) diff |= (x[i] || 0) ^ (y[i] || 0)
  return diff === 0
}

export async function hmac(secret, text) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return hex(await crypto.subtle.sign('HMAC', key, enc.encode(text)))
}

// Browsers always send Origin on cross-site POSTs; a missing Origin (curl, same-site GET) is allowed.
export function sameOrigin(request, url) {
  const o = request.headers.get('Origin')
  if (!o) return true
  try {
    return new URL(o).host === url.host
  } catch {
    return false
  }
}

// Rate-limit counter stored in KV. Each call is 1 read + 1 write, and the free plan allows only
// about 1,000 KV writes a day for the WHOLE site, so a bot could burn the quota and then every
// later write (including a real customer's enquiry) would fail.
// So by default this FAILS OPEN: if KV refuses the counter write, the request is allowed through.
// Pass { failClosed: true } where being too permissive is worse (the admin login).
export async function bump(env, key, limit, ttl, { failClosed = false } = {}) {
  try {
    const n = Number(await env.DB.get(key)) || 0
    if (n >= limit) return false
    await env.DB.put(key, String(n + 1), { expirationTtl: Math.max(60, ttl) })
    return true
  } catch {
    return !failClosed
  }
}

// ---------- admin session ----------
export const SESSION_DAYS = 7
export const SESSION_MS = SESSION_DAYS * 86400000
export const REVOKE_KEY = 'auth:validAfter' // sessions issued before this time are no longer accepted

export async function isAuthed(request, env) {
  if (!env.SESSION_SECRET) return false
  const m = (request.headers.get('Cookie') || '').match(/(?:^|;\s*)__Host-session=([^;]+)/)
  if (!m) return false
  const [exp, sig] = m[1].split('.')
  if (!exp || !sig || !(Number(exp) > Date.now())) return false
  if (!safeEqual(sig, await hmac(env.SESSION_SECRET, exp))) return false
  // The token was issued SESSION_MS before it expires. Logging out stores a "valid after" time,
  // which cancels every session issued before it. (KV can take up to about a minute to spread that worldwide.)
  const issuedAt = Number(exp) - SESSION_MS
  const validAfter = Number(await env.DB.get(REVOKE_KEY)) || 0
  return issuedAt > validAfter
}

