// Cloudflare Pages Function: POST /api/assistant  (the chat widget's brain)
// Runs a small model on Cloudflare Workers AI. Needs a Workers AI binding named AI
// (Pages project > Settings > Bindings > Add > Workers AI, variable name: AI).
// Without that binding it still answers, with a friendly "use WhatsApp" message, so the widget never breaks.
// It also needs the KV binding DB (already used by the rest of the site) for rate limiting.
import {
  MODEL,
  BACKUP_MODEL,
  VISION_MODEL,
  FALLBACK_REPLY,
  buildSystemPrompt,
  buildVisionPrompt,
  cleanReply,
  cleanSeen,
  photoFailReply,
  socialReply,
  withPhotoNote,
} from '../../src/lib/assistantFacts.js'
import { json, sameOrigin, bump, hmac, safeEqual, isAuthed } from '../_lib/shared.js'
import { site as siteDefault } from '../../src/data/site.js'
import { contact as contactDefault } from '../../src/data/contact.js'
import { projects as projectsDefault } from '../../src/data/projects.js'

const PER_IP_PER_HOUR = 20
// Each question costs 2 KV writes and the free plan allows 1,000 writes a day in total.
// 300 questions = 600 writes, which leaves room for call requests, photos and the dashboard.
// A question with a photo costs 2 more writes (60 photo questions a day = 120), so keep PER_DAY_PHOTOS small.
const PER_DAY_TOTAL = 300
const MAX_TURNS = 8
const MAX_CHARS = 400
const MAX_SEEN = 680 // + 17 characters of signature = 697, still inside the 700 the browser keeps
// A photo question costs one vision run on top of the text run, so it has its own, tighter limits.
const PER_IP_PHOTOS_PER_HOUR = 6
const PER_DAY_PHOTOS = 60
const MAX_BODY = 1_200_000 // the browser shrinks photos to about 420 KB before sending; base64 adds a third
const MAX_IMAGE_CHARS = 900_000
const IMAGE_RE = /^data:image\/(jpeg|webp|png);base64,[A-Za-z0-9+/]+=*$/

const fallback = (why) => json({ reply: FALLBACK_REPLY, fallback: true, why })

// Same merge the site itself uses: built-in defaults, overridden by what the dashboard saved.
async function liveContent(env) {
  let c = {}
  try {
    c = JSON.parse((await env.DB.get('content')) || '{}') || {}
  } catch {
    // fall back to defaults
  }
  const contact = { ...contactDefault }
  for (const k of ['email', 'whatsapp', 'instagram', 'tiktok']) {
    if (typeof c.contact?.[k] === 'string' && c.contact[k].trim()) contact[k] = c.contact[k]
  }
  return {
    site: { ...siteDefault, ...(c.site || {}) },
    contact,
    projects: Array.isArray(c.projects) ? c.projects : projectsDefault,
  }
}

// Keep tabs and newlines, drop other control characters.
const stripControl = (t) => [...t].filter((ch) => ch === '\n' || ch === '\t' || ch.charCodeAt(0) >= 32).join('')

// Never trust the browser: only user/assistant turns, short, recent. A visitor cannot inject a "system" message.
// `seen` is the photo description this server returned earlier; only a user turn may carry one.
// The photo description is signed by this server, so a visitor cannot write their own "description"
// to smuggle instructions into the model's prompt. Format: "<16 hex signature>.<description>".
const signSeen = async (env, text) => `${(await hmac(env.SESSION_SECRET || 'unsigned', `seen:${text}`)).slice(0, 16)}.${text}`
async function verifySeen(env, value) {
  const dot = typeof value === 'string' ? value.indexOf('.') : -1
  if (dot !== 16) return ''
  const text = cleanSeen(value.slice(17)).slice(0, MAX_SEEN)
  const sig = (await hmac(env.SESSION_SECRET || 'unsigned', `seen:${text}`)).slice(0, 16)
  return safeEqual(sig, value.slice(0, 16)) ? text : ''
}

function cleanMessages(input) {
  if (!Array.isArray(input)) return []
  return input
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map((m) => ({
      role: m.role,
      content: stripControl(m.content).trim().slice(0, MAX_CHARS),
      seen: m.role === 'user' && typeof m.seen === 'string' ? m.seen.slice(0, 720) : '',
    }))
    .filter((m) => m.content)
    .slice(-MAX_TURNS)
}

// '' = no photo, 'bad' = something was sent that is not a small JPEG/PNG/WebP data URL.
function cleanImage(v) {
  if (v === undefined || v === null || v === '') return ''
  if (typeof v !== 'string' || v.length > MAX_IMAGE_CHARS || !IMAGE_RE.test(v)) return 'bad'
  return v
}

// Meta makes every account accept the Llama 3.2 licence once, by sending the prompt "agree". Do that automatically.
async function readPhoto(env, image, ask) {
  const input = {
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: buildVisionPrompt(ask) },
          { type: 'image_url', image_url: { url: image } },
        ],
      },
    ],
    max_tokens: 260,
    temperature: 0.2,
  }
  let out
  try {
    out = await env.AI.run(VISION_MODEL, input)
  } catch (err) {
    if (!/agree|licen[cs]e|5016/i.test(String(err?.message || err))) throw err
    await env.AI.run(VISION_MODEL, { prompt: 'agree', max_tokens: 5 })
    out = await env.AI.run(VISION_MODEL, input)
  }
  return cleanSeen(out?.response ?? out?.description)
}

export async function onRequestPost({ request, env }) {
  const url = new URL(request.url)
  try {
    if (!sameOrigin(request, url)) return json({ error: 'Bad origin.' }, 403)
    if (Number(request.headers.get('Content-Length') || 0) > MAX_BODY) return json({ error: 'Too large.' }, 413)
    let body
    try {
      body = await request.json()
    } catch {
      return json({ error: 'Invalid JSON.' }, 400)
    }
    const messages = cleanMessages(body?.messages)
    if (!messages.length || messages[messages.length - 1].role !== 'user') return json({ error: 'Ask a question first.' }, 400)
    for (const m of messages) m.seen = m.seen ? await verifySeen(env, m.seen) : ''
    const image = cleanImage(body?.image)
    if (image === 'bad') return json({ error: 'That photo could not be used. Please try a JPEG, PNG or WebP image.' }, 400)

    const live = await liveContent(env)
    const first = String(live.site.name || 'us').split(' ')[0]

    // Someone asking for a social link gets the exact link from our data, not whatever a small model remembers.
    if (!image) {
      const links = socialReply(messages[messages.length - 1].content, live.contact)
      if (links) return json({ reply: links })
    }

    if (!env.AI) return fallback('no-ai-binding')
    if (env.DB) {
      const ip = request.headers.get('CF-Connecting-IP') || 'local'
      const day = new Date().toISOString().slice(0, 10)
      if (!(await bump(env, `rl:ai:${ip}`, PER_IP_PER_HOUR, 3600))) return json({ error: 'Too many questions. Please try again later.' }, 429)
      if (!(await bump(env, `rl:ai:day:${day}`, PER_DAY_TOTAL, 90000))) return fallback('daily-limit')
      if (image) {
        if (!(await bump(env, `rl:aiphoto:${ip}`, PER_IP_PHOTOS_PER_HOUR, 3600))) return json({ error: 'Too many photos for now. Please try again later, or send it on WhatsApp.' }, 429)
        if (!(await bump(env, `rl:aiphoto:day:${day}`, PER_DAY_PHOTOS, 90000))) return fallback('daily-photo-limit')
      }
    }

    let seen = ''
    if (image) {
      try {
        seen = (await readPhoto(env, image, messages[messages.length - 1].content)).slice(0, MAX_SEEN)
      } catch (err) {
        console.error('assistant: vision failed', String(err?.message || err).slice(0, 300))
      }
      if (!seen) return json({ reply: photoFailReply(first), fallback: true, why: 'vision-error' })
      messages[messages.length - 1].seen = seen
    }

    const history = messages.map((m) => ({ role: m.role, content: m.seen ? withPhotoNote(m.content, m.seen) : m.content }))
    const prompt = [{ role: 'system', content: buildSystemPrompt(live) }, ...history]
    let reply = ''
    for (const model of [MODEL, BACKUP_MODEL]) {
      try {
        const out = await env.AI.run(model, { messages: prompt, max_tokens: 220, temperature: 0.4 })
        reply = cleanReply(out?.response)
        if (reply) break
      } catch (err) {
        console.error('assistant: model failed', model, String(err?.message || err).slice(0, 300))
      }
    }
    return reply ? json(seen ? { reply, seen: await signSeen(env, seen) } : { reply }) : fallback('model-error')
  } catch (err) {
    console.error('assistant: unexpected error', String(err?.message || err).slice(0, 300))
    return fallback('error')
  }
}

// Setup check for the owner only (it reveals which bindings exist). Sign in to /admin first, then open /api/assistant.
export async function onRequestGet({ request, env }) {
  if (!env.DB || !(await isAuthed(request, env))) return json({ error: 'Not found.' }, 404)
  return json({ ai: Boolean(env.AI), kv: Boolean(env.DB), model: MODEL, vision: VISION_MODEL })
}
