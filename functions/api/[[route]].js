// Cloudflare Pages Function: every /api/* route.
//   Public:  GET /api/content, POST /api/contact, GET /api/media/:id
//   Private: /api/admin/*  (needs the password session cookie)
// Needs: a KV binding named DB, and two secrets: ADMIN_PASSWORD and SESSION_SECRET.

const enc = new TextEncoder()
const COOKIE = '__Host-session'
const SESSION_DAYS = 7
const MAX_MEDIA = 2 * 1024 * 1024

class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers },
  })

const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
const sha256 = async (s) => new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(s)))

function safeEqual(a, b) {
  const x = typeof a === 'string' ? enc.encode(a) : a
  const y = typeof b === 'string' ? enc.encode(b) : b
  let diff = x.length ^ y.length
  const n = Math.max(x.length, y.length)
  for (let i = 0; i < n; i++) diff |= (x[i] || 0) ^ (y[i] || 0)
  return diff === 0
}

async function hmac(secret, text) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return hex(await crypto.subtle.sign('HMAC', key, enc.encode(text)))
}

async function makeToken(env) {
  const exp = Date.now() + SESSION_DAYS * 86400000
  return `${exp}.${await hmac(env.SESSION_SECRET, String(exp))}`
}

async function isAuthed(request, env) {
  if (!env.SESSION_SECRET) return false
  const m = (request.headers.get('Cookie') || '').match(/(?:^|;\s*)__Host-session=([^;]+)/)
  if (!m) return false
  const [exp, sig] = m[1].split('.')
  if (!exp || !sig || !(Number(exp) > Date.now())) return false
  return safeEqual(sig, await hmac(env.SESSION_SECRET, exp))
}

function sameOrigin(request, url) {
  const o = request.headers.get('Origin')
  if (!o) return true
  try {
    return new URL(o).host === url.host
  } catch {
    return false
  }
}

async function readJson(request) {
  if (Number(request.headers.get('Content-Length') || 0) > 300000) throw new HttpError(413, 'Request too large.')
  try {
    return await request.json()
  } catch {
    throw new HttpError(400, 'Invalid JSON.')
  }
}

// ---------- cleaning (never trust the browser) ----------
const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
const okUrl = (v) => v === '' || /^\/(?!\/)\S*$/.test(v) || /^https?:\/\/\S+$/i.test(v)
const url = (v, max = 400) => {
  const s = str(v, max)
  if (!okUrl(s)) throw new HttpError(400, `Not a valid link: ${s.slice(0, 40)}`)
  return s
}

function cleanSite(s = {}) {
  const out = {}
  for (const [k, max] of [['name', 80], ['role', 120], ['location', 120], ['availability', 120]]) {
    if (k in s) out[k] = str(s[k], max)
  }
  if ('available' in s) out.available = Boolean(s.available)
  if ('portrait' in s) out.portrait = url(s.portrait, 300)
  return out
}

function cleanContact(c = {}) {
  const out = {}
  if ('email' in c) {
    out.email = str(c.email, 200)
    if (out.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(out.email)) throw new HttpError(400, 'Email address is not valid.')
  }
  if ('whatsapp' in c) out.whatsapp = str(c.whatsapp, 30).replace(/\D/g, '')
  if ('instagram' in c) out.instagram = url(c.instagram)
  if ('tiktok' in c) out.tiktok = url(c.tiktok)
  return out
}

function cleanProject(p) {
  if (!p || typeof p !== 'object') throw new HttpError(400, 'Bad project.')
  const slug = str(p.slug, 60).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '')
  const title = str(p.title, 120)
  if (!slug || !title) throw new HttpError(400, 'Every project needs a title and a slug.')
  const out = {
    slug,
    title,
    category: str(p.category, 120),
    group: str(p.group, 60) || 'Websites',
    image: url(p.image),
    href: url(p.href),
    live: str(p.live, 120),
    liveLabel: str(p.liveLabel, 60),
    summary: str(p.summary, 2000),
    solution: str(p.solution, 4000),
    location: str(p.location, 120),
    year: str(p.year, 20),
    results: (Array.isArray(p.results) ? p.results : []).slice(0, 10).map((r) => ({
      label: str(r?.label, 200),
      value: str(r?.value, 500),
      note: str(r?.note, 500),
    })),
    published: Boolean(p.published),
  }
  if (p.service && str(p.service.label, 60)) out.service = { label: str(p.service.label, 60), to: url(p.service.to, 100) }
  return out
}

function cleanContent(input) {
  const out = {}
  if (input.site) out.site = cleanSite(input.site)
  if (input.contact) out.contact = cleanContact(input.contact)
  if (input.projects) {
    if (!Array.isArray(input.projects) || input.projects.length > 50) throw new HttpError(400, 'Too many projects.')
    out.projects = input.projects.map(cleanProject)
    const slugs = out.projects.map((p) => p.slug)
    if (new Set(slugs).size !== slugs.length) throw new HttpError(400, 'Two projects share the same slug.')
  }
  return out
}

// ---------- storage helpers ----------
async function getContent(env) {
  try {
    return JSON.parse((await env.DB.get('content')) || '{}') || {}
  } catch {
    return {}
  }
}

async function bump(env, key, limit, ttl) {
  const n = Number(await env.DB.get(key)) || 0
  if (n >= limit) return false
  await env.DB.put(key, String(n + 1), { expirationTtl: ttl })
  return true
}

const metaOf = (m) => {
  const meta = {
    name: m.name.slice(0, 50),
    email: m.email.slice(0, 100),
    service: (m.service || '').slice(0, 40),
    createdAt: m.createdAt,
    read: m.read,
    preview: m.message.slice(0, 100),
  }
  if (JSON.stringify(meta).length > 900) delete meta.preview
  return meta
}

const sniff = (b) => {
  const u = new Uint8Array(b.slice(0, 12))
  if (u[0] === 0xff && u[1] === 0xd8 && u[2] === 0xff) return 'image/jpeg'
  if (u[0] === 0x89 && u[1] === 0x50 && u[2] === 0x4e && u[3] === 0x47) return 'image/png'
  if (u[0] === 0x52 && u[1] === 0x49 && u[8] === 0x57 && u[9] === 0x45) return 'image/webp'
  return null
}

const randomHex = (n) => hex(crypto.getRandomValues(new Uint8Array(n)))

// ---------- the router ----------
export async function onRequest({ request, env }) {
  const u = new URL(request.url)
  const path = u.pathname.replace(/^\/api\/?/, '').replace(/\/$/, '')
  const parts = path.split('/')
  const method = request.method
  const ip = request.headers.get('CF-Connecting-IP') || 'local'

  try {
    if (!env.DB) throw new HttpError(503, 'Storage is not connected yet.')

    // ----- public -----
    if (path === 'content' && method === 'GET') {
      const c = await getContent(env)
      if (Array.isArray(c.projects)) c.projects = c.projects.filter((p) => p.published)
      return json(c, 200, { 'Cache-Control': 'public, max-age=30' })
    }

    if (path === 'contact' && method === 'POST') {
      if (!sameOrigin(request, u)) throw new HttpError(403, 'Bad origin.')
      const b = await readJson(request)
      const name = str(b.name, 100)
      const email = str(b.email, 200)
      const message = str(b.message, 5000)
      if (!name || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, 'Please fill in your name, a valid email and a message.')
      if (b.website || !(Number(b.elapsedMs) >= 2000)) return json({ ok: true }) // bot: pretend it worked
      if (!(await bump(env, `rl:contact:${ip}`, 5, 3600))) throw new HttpError(429, 'Too many messages. Please try again later.')
      const id = `${String(9999999999999 - Date.now()).padStart(13, '0')}-${randomHex(3)}`
      const m = {
        id,
        name,
        email,
        phone: str(b.phone, 30).replace(/[^\d+()\-\s]/g, ''),
        company: str(b.company, 150),
        service: str(b.service, 60),
        message,
        page: str(b.page, 100),
        createdAt: new Date().toISOString(),
        read: false,
      }
      await env.DB.put(`msg:${id}`, JSON.stringify(m), { metadata: metaOf(m) })
      return json({ ok: true })
    }

    if (parts[0] === 'media' && parts[1] && method === 'GET') {
      const { value, metadata } = await env.DB.getWithMetadata(`media:${parts[1]}`, 'arrayBuffer')
      if (!value) throw new HttpError(404, 'Not found.')
      return new Response(value, {
        headers: {
          'Content-Type': metadata?.type || 'application/octet-stream',
          'Cache-Control': 'public, max-age=31536000, immutable',
          'X-Content-Type-Options': 'nosniff',
        },
      })
    }

    // ----- private: /api/admin/* -----
    if (parts[0] === 'admin') {
      if (method !== 'GET' && !sameOrigin(request, u)) throw new HttpError(403, 'Bad origin.')

      if (path === 'admin/login' && method === 'POST') {
        if (!env.ADMIN_PASSWORD || !env.SESSION_SECRET) throw new HttpError(503, 'The dashboard is not configured yet.')
        const rl = `rl:login:${ip}`
        if ((Number(await env.DB.get(rl)) || 0) >= 5) throw new HttpError(429, 'Too many attempts. Try again in 15 minutes.')
        const { password } = await readJson(request)
        const ok = typeof password === 'string' && safeEqual(await sha256(password), await sha256(env.ADMIN_PASSWORD))
        if (!ok) {
          await bump(env, rl, 5, 900)
          throw new HttpError(401, 'Wrong password.')
        }
        await env.DB.delete(rl)
        const maxAge = SESSION_DAYS * 86400
        return json({ ok: true }, 200, {
          'Set-Cookie': `${COOKIE}=${await makeToken(env)}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Strict`,
        })
      }

      if (path === 'admin/logout' && method === 'POST') {
        return json({ ok: true }, 200, { 'Set-Cookie': `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict` })
      }

      if (!(await isAuthed(request, env))) throw new HttpError(401, 'Not signed in.')

      if (path === 'admin/me' && method === 'GET') return json({ ok: true })

      if (path === 'admin/content' && method === 'GET') return json(await getContent(env))

      if (path === 'admin/content' && method === 'PUT') {
        const merged = { ...(await getContent(env)), ...cleanContent(await readJson(request)) }
        await env.DB.put('content', JSON.stringify(merged))
        return json(merged)
      }

      if (path === 'admin/messages' && method === 'GET') {
        const { keys } = await env.DB.list({ prefix: 'msg:', limit: 200 })
        return json(keys.map((k) => ({ id: k.name.slice(4), ...(k.metadata || {}) })))
      }

      if (parts[1] === 'messages' && parts[2]) {
        const key = `msg:${parts[2]}`
        const raw = await env.DB.get(key)
        if (!raw) throw new HttpError(404, 'Message not found.')
        const m = JSON.parse(raw)
        if (method === 'GET') return json(m)
        if (method === 'DELETE') {
          await env.DB.delete(key)
          return json({ ok: true })
        }
        if (method === 'PATCH') {
          const b = await readJson(request)
          m.read = Boolean(b.read)
          await env.DB.put(key, JSON.stringify(m), { metadata: metaOf(m) })
          return json(m)
        }
      }

      if (path === 'admin/media' && method === 'POST') {
        const buf = await request.arrayBuffer()
        if (buf.byteLength > MAX_MEDIA) throw new HttpError(413, 'Image is over 2 MB.')
        const type = sniff(buf)
        if (!type) throw new HttpError(400, 'Only JPEG, PNG or WebP images are allowed.')
        const id = randomHex(8)
        await env.DB.put(`media:${id}`, buf, { metadata: { type } })
        return json({ url: `/api/media/${id}` })
      }
    }

    throw new HttpError(404, 'Not found.')
  } catch (e) {
    if (e instanceof HttpError) return json({ error: e.message }, e.status)
    return json({ error: 'Server error.' }, 500)
  }
}
