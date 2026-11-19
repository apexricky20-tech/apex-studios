// Cloudflare Pages Function: every /api/* route.
//   Public:  GET /api/content, POST /api/contact, POST /api/lead-photo, GET /api/media/:id
//   Private: /api/admin/*  (needs the password session cookie)
// Needs: a KV binding named DB, and two secrets: ADMIN_PASSWORD and SESSION_SECRET.
// Optional (new-enquiry alerts on Telegram): secrets TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID.
// Optional (dashboard "Publish changes" button): secret DEPLOY_HOOK_URL, a free Cloudflare Pages deploy hook.

import { HttpError, json, randomHex, sha256, safeEqual, hmac, sameOrigin, bump, isAuthed, REVOKE_KEY, SESSION_DAYS } from '../_lib/shared.js'

const COOKIE = '__Host-session'
const MAX_MEDIA = 2 * 1024 * 1024
const INBOX_PAGE = 100
const MAX_LEAD_PHOTO = 800 * 1024 // chat photos are shrunk in the browser first, so real ones are far smaller
const LEAD_PHOTO_TTL = 30 * 86400 // photos delete themselves after 30 days, so the free 1 GB of KV never fills up
const LEAD_PHOTOS_PER_IP_HOUR = 6
const LEAD_PHOTOS_PER_DAY = 25
const MAX_PHOTOS_PER_LEAD = 3
const PHOTO_ID_RE = /^[a-f0-9]{16}$/
const DEPLOY_HOOK_COOLDOWN = 120
const FORM_MIN_MS = 2000 // a human cannot fill the form faster than this
const FORM_MAX_MS = 12 * 3600 * 1000 // a form left open longer than this must be reloaded
const CONTACT_PER_DAY = 100 // overall cap, so many connections together cannot flood the inbox or Telegram

// Plain addresses only. Characters like ? & = % , ; are rejected because the dashboard's "Reply by email"
// link and mail clients treat them as commands (for example ?bcc=).
const EMAIL_RE = /^[A-Za-z0-9._+'-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/

async function makeToken(env) {
  const exp = Date.now() + SESSION_DAYS * 86400000
  return `${exp}.${await hmac(env.SESSION_SECRET, String(exp))}`
}

// ---------- contact form token: proves the page was open for a moment before it was sent ----------
// The server signs the time the form was opened; the browser cannot invent or shorten it.
// "form:" keeps these signatures different from login-session signatures.
async function makeFormToken(env) {
  const ts = Date.now()
  return `${ts}.${await hmac(env.SESSION_SECRET, `form:${ts}`)}`
}

async function checkFormToken(env, token) {
  const [ts, sig] = String(token || '').split('.')
  if (!ts || !sig || !/^\d{10,16}$/.test(ts)) return 'bad'
  if (!safeEqual(sig, await hmac(env.SESSION_SECRET, `form:${ts}`))) return 'bad'
  const age = Date.now() - Number(ts)
  if (age < 0 || age > FORM_MAX_MS) return 'expired'
  return age < FORM_MIN_MS ? 'fast' : 'ok'
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
    if (out.email && !EMAIL_RE.test(out.email)) throw new HttpError(400, 'Email address is not valid.')
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

const metaOf = (m) => {
  const meta = {
    name: m.name.slice(0, 50),
    email: (m.email || '').slice(0, 100),
    service: (m.service || '').slice(0, 40),
    createdAt: m.createdAt,
    read: m.read,
    preview: m.message.slice(0, 100),
  }
  if (m.via === 'chat') meta.via = 'chat'
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

// ---------- new-enquiry alerts (Telegram) ----------
const alertsConfigured = (env) => Boolean(env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID)

// Kenyan numbers like 0712345678 become 254712345678 so the WhatsApp link works.
const waDigits = (p) => {
  const d = (p || '').replace(/\D/g, '')
  if (/^0\d{9}$/.test(d)) return `254${d.slice(1)}`
  if (/^[17]\d{8}$/.test(d)) return `254${d}`
  return d
}

async function sendTelegram(env, text) {
  if (!alertsConfigured(env)) return { ok: false, error: 'Alerts are not set up yet.' }
  try {
    const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text, disable_web_page_preview: true }),
    })
    if (res.ok) return { ok: true }
    let why = `status ${res.status}`
    try {
      why = (await res.json()).description || why
    } catch {
      // not JSON
    }
    return { ok: false, error: `Telegram said: ${why}` }
  } catch {
    return { ok: false, error: 'Could not reach Telegram.' }
  }
}

function enquiryAlert(m, origin) {
  const wa = waDigits(m.phone)
  const lines = [
    m.via === 'chat' ? 'New call request from the chat assistant' : 'New enquiry from your website',
    '',
    `Name: ${m.name}`,
    m.email ? `Email: ${m.email}` : null,
    m.phone ? `Phone: ${m.phone}` : null,
    m.company ? `Company: ${m.company}` : null,
    m.service ? `Needs: ${m.service}` : null,
    m.source ? `Came from: ${m.source}` : null,
    m.referrer ? `Referred by: ${m.referrer}` : null,
    m.photos?.length ? `Photos attached: ${m.photos.length} (open the dashboard to see them)` : null,
    '',
    m.message.length > 1200 ? `${m.message.slice(0, 1200)}...` : m.message,
    '',
    wa.length >= 10 ? `Reply on WhatsApp: https://wa.me/${wa}` : null,
    `Open inbox: ${origin}/21`,
  ]
  return lines.filter((l) => l !== null).join('\n')
}

// ---------- the router ----------
export async function onRequest({ request, env, waitUntil }) {
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

    if (path === 'form-token' && method === 'GET') {
      // Without SESSION_SECRET there is nothing to sign with; the form then skips the timing check.
      return json({ token: env.SESSION_SECRET ? await makeFormToken(env) : '' })
    }

    // A visitor attaches a photo in the chat. Stored privately (only the dashboard can open it) and auto-deleted.
    if (path === 'lead-photo' && method === 'POST') {
      if (!sameOrigin(request, u)) throw new HttpError(403, 'Bad origin.')
      if (Number(request.headers.get('Content-Length') || 0) > MAX_LEAD_PHOTO) throw new HttpError(413, 'Photo is too large.')
      // Limits first, so a flood is turned away before its body is read into memory.
      if (!(await bump(env, `rl:photo:${ip}`, LEAD_PHOTOS_PER_IP_HOUR, 3600))) throw new HttpError(429, 'Too many photos. Please try again later.')
      const day = new Date().toISOString().slice(0, 10)
      if (!(await bump(env, `rl:photo:day:${day}`, LEAD_PHOTOS_PER_DAY, 90000))) {
        throw new HttpError(429, 'Photo uploads are busy right now. You can send photos on WhatsApp instead.')
      }
      const buf = await request.arrayBuffer()
      if (!buf.byteLength) throw new HttpError(400, 'No photo received.')
      if (buf.byteLength > MAX_LEAD_PHOTO) throw new HttpError(413, 'Photo is too large.')
      if (!sniff(buf)) throw new HttpError(400, 'Only JPEG, PNG or WebP photos are allowed.')
      const id = randomHex(8)
      await env.DB.put(`leadphoto:${id}`, buf, { metadata: { type: sniff(buf) }, expirationTtl: LEAD_PHOTO_TTL })
      return json({ id })
    }

    if (path === 'contact' && method === 'POST') {
      if (!sameOrigin(request, u)) throw new HttpError(403, 'Bad origin.')
      const b = await readJson(request)
      const name = str(b.name, 100)
      const email = str(b.email, 200)
      const phone = str(b.phone, 30).replace(/[^\d+()\-\s]/g, '')
      const message = str(b.message, 5000)
      const emailOk = EMAIL_RE.test(email)
      const phoneOk = phone.replace(/\D/g, '').length >= 9
      if (!name || !message || (email && !emailOk) || (!emailOk && !phoneOk)) {
        throw new HttpError(400, 'Please add your name, a message, and a valid phone number or email.')
      }
      if (b.website) return json({ ok: true }) // hidden field filled: a bot, pretend it worked
      if (env.SESSION_SECRET) {
        const t = await checkFormToken(env, b.formToken)
        if (t === 'fast') return json({ ok: true }) // sent faster than a person can type: pretend it worked
        if (t !== 'ok') throw new HttpError(400, 'This page has been open for a while. Please reload it and send again.')
      }
      if (!(await bump(env, `rl:contact:${ip}`, 5, 3600))) throw new HttpError(429, 'Too many messages. Please try again later.')
      const day = new Date().toISOString().slice(0, 10)
      if (!(await bump(env, `rl:contact:day:${day}`, CONTACT_PER_DAY, 90000))) {
        throw new HttpError(429, 'We are getting a lot of messages right now. Please message us on WhatsApp instead.')
      }
      const id = `${String(9999999999999 - Date.now()).padStart(13, '0')}-${randomHex(3)}`
      const m = {
        id,
        name,
        email,
        phone,
        company: str(b.company, 150),
        service: str(b.service, 60),
        message,
        page: str(b.page, 100),
        source: str(b.source, 150).replace(/[\r\n]+/g, ' '),
        referrer: str(b.referrer, 100).replace(/[\r\n]+/g, ' '),
        createdAt: new Date().toISOString(),
        read: false,
      }
      if (b.via === 'chat') m.via = 'chat'
      if (Array.isArray(b.photos)) {
        m.photos = [...new Set(b.photos.filter((x) => typeof x === 'string' && PHOTO_ID_RE.test(x)))].slice(0, MAX_PHOTOS_PER_LEAD)
        if (!m.photos.length) delete m.photos
      }
      // A real enquiry must never be lost. If KV refuses the write (free-plan daily write quota used up,
      // or an outage), the Telegram alert, which carries the whole message, is the fallback copy.
      let saved = true
      try {
        await env.DB.put(`msg:${id}`, JSON.stringify(m), { metadata: metaOf(m) })
      } catch {
        saved = false
      }
      const alertText = enquiryAlert(m, u.origin)
      if (saved) {
        // Tell the owner right away. This never delays or breaks the visitor's form.
        const alert = sendTelegram(env, alertText)
        if (typeof waitUntil === 'function') waitUntil(alert)
        return json({ ok: true })
      }
      const r = await sendTelegram(env, `${alertText}\n\n(Not saved in the dashboard: storage was full. This message is the only copy.)`)
      if (r.ok) return json({ ok: true })
      throw new HttpError(503, 'We could not save your message right now. Please message us on WhatsApp instead.')
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
          await bump(env, rl, 5, 900, { failClosed: true })
          throw new HttpError(401, 'Wrong password.')
        }
        await env.DB.delete(rl)
        const maxAge = SESSION_DAYS * 86400
        return json({ ok: true }, 200, {
          'Set-Cookie': `${COOKIE}=${await makeToken(env)}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Strict`,
        })
      }

      if (path === 'admin/logout' && method === 'POST') {
        if (await isAuthed(request, env)) await env.DB.put(REVOKE_KEY, String(Date.now()))
        return json({ ok: true }, 200, { 'Set-Cookie': `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict` })
      }

      if (!(await isAuthed(request, env))) throw new HttpError(401, 'Not signed in.')

      if (path === 'admin/me' && method === 'GET') return json({ ok: true })

      if (path === 'admin/content' && method === 'GET') return json(await getContent(env))

      if (path === 'admin/alerts' && method === 'GET') return json({ configured: alertsConfigured(env) })

      if (path === 'admin/alerts/test' && method === 'POST') {
        if (!alertsConfigured(env)) throw new HttpError(400, 'Alerts are not set up yet. Add TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in Cloudflare, then redeploy.')
        const r = await sendTelegram(env, 'Test alert from your Apex Studios dashboard. New enquiries will arrive here.')
        if (!r.ok) throw new HttpError(502, r.error)
        return json({ ok: true })
      }

      // Publish dashboard edits to the static pages (SEO tags, sitemap, prerendered text) by triggering a rebuild.
      // Uses a Cloudflare Pages deploy hook (free). Builds are limited to once every two minutes.
      if (path === 'admin/rebuild' && method === 'POST') {
        if (!env.DEPLOY_HOOK_URL) throw new HttpError(400, 'Publishing is not set up yet. Add the DEPLOY_HOOK_URL secret in Cloudflare Pages (see the README).')
        if (!(await bump(env, 'rl:rebuild', 1, DEPLOY_HOOK_COOLDOWN, { failClosed: true }))) throw new HttpError(429, 'A rebuild was just started. Wait two minutes before the next one.')
        let res
        try {
          res = await fetch(env.DEPLOY_HOOK_URL, { method: 'POST' })
        } catch {
          throw new HttpError(502, 'Could not reach Cloudflare to start the rebuild.')
        }
        if (!res.ok) throw new HttpError(502, `Cloudflare refused the rebuild (status ${res.status}). Check the deploy hook URL.`)
        return json({ ok: true })
      }

      if (path === 'admin/rebuild-status' && method === 'GET') return json({ configured: Boolean(env.DEPLOY_HOOK_URL) })

      // Backup: the browser calls this in pages of 40 messages (KV limits how much one request may read).
      if (path === 'admin/export' && method === 'GET') {
        const cursor = u.searchParams.get('cursor') || undefined
        const page = await env.DB.list({ prefix: 'msg:', limit: 40, cursor })
        const messages = (
          await Promise.all(
            page.keys.map(async (k) => {
              try {
                return JSON.parse(await env.DB.get(k.name))
              } catch {
                return null
              }
            }),
          )
        ).filter(Boolean)
        return json({
          content: cursor ? undefined : await getContent(env),
          messages,
          cursor: page.list_complete ? null : page.cursor,
        })
      }

      if (path === 'admin/content' && method === 'PUT') {
        const merged = { ...(await getContent(env)), ...cleanContent(await readJson(request)) }
        await env.DB.put('content', JSON.stringify(merged))
        return json(merged)
      }

      // The inbox loads in pages (newest first, because ids start with a reversed timestamp).
      // Reply: { items: [...], cursor }. cursor is null on the last page; send it back as ?cursor= for the next one.
      if (path === 'admin/messages' && method === 'GET') {
        const cursor = u.searchParams.get('cursor') || undefined
        const page = await env.DB.list({ prefix: 'msg:', limit: INBOX_PAGE, cursor })
        return json({
          items: page.keys.map((k) => ({ id: k.name.slice(4), ...(k.metadata || {}) })),
          cursor: page.list_complete ? null : page.cursor,
        })
      }

      if (parts[1] === 'messages' && parts[2]) {
        const key = `msg:${parts[2]}`
        const raw = await env.DB.get(key)
        if (!raw) throw new HttpError(404, 'Message not found.')
        const m = JSON.parse(raw)
        if (method === 'GET') return json(m)
        if (method === 'DELETE') {
          await Promise.all((m.photos || []).filter((x) => PHOTO_ID_RE.test(x)).map((x) => env.DB.delete(`leadphoto:${x}`)))
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

      if (parts[1] === 'lead-photo' && parts[2] && method === 'GET') {
        if (!PHOTO_ID_RE.test(parts[2])) throw new HttpError(404, 'Not found.')
        const { value, metadata } = await env.DB.getWithMetadata(`leadphoto:${parts[2]}`, 'arrayBuffer')
        if (!value) throw new HttpError(404, 'This photo has expired or was deleted.')
        return new Response(value, {
          headers: {
            'Content-Type': metadata?.type || 'application/octet-stream',
            'Cache-Control': 'private, max-age=3600',
            'X-Content-Type-Options': 'nosniff',
          },
        })
      }

      if (path === 'admin/media' && method === 'POST') {
        // Refuse by the declared size first, so an oversized body is never read into memory.
        const declared = Number(request.headers.get('Content-Length') || 0)
        if (declared > MAX_MEDIA) throw new HttpError(413, 'Image is over 2 MB.')
        const buf = await request.arrayBuffer()
        // Content-Length can be missing or wrong, so check the real size too.
        if (buf.byteLength === 0) throw new HttpError(400, 'No image received.')
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
