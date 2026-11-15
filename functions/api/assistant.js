// Cloudflare Pages Function: POST /api/assistant  (the chat widget's brain)
// Runs a small model on Cloudflare Workers AI. Needs a Workers AI binding named AI
// (Pages project > Settings > Bindings > Add > Workers AI, variable name: AI).
// Without that binding it still answers, with a friendly "use WhatsApp" message, so the widget never breaks.
// It also needs the KV binding DB (already used by the rest of the site) for rate limiting.
import { MODEL, BACKUP_MODEL, FALLBACK_REPLY, buildSystemPrompt, cleanReply } from '../../src/lib/assistantFacts.js'
import { site as siteDefault } from '../../src/data/site.js'
import { contact as contactDefault } from '../../src/data/contact.js'
import { projects as projectsDefault } from '../../src/data/projects.js'

const PER_IP_PER_HOUR = 20
const PER_DAY_TOTAL = 400
const MAX_TURNS = 8
const MAX_CHARS = 400

const fallback = (why) => json({ reply: FALLBACK_REPLY, fallback: true, why })

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })

function sameOrigin(request, url) {
  const o = request.headers.get('Origin')
  if (!o) return true
  try {
    return new URL(o).host === url.host
  } catch {
    return false
  }
}

async function bump(env, key, limit, ttl) {
  const n = Number(await env.DB.get(key)) || 0
  if (n >= limit) return false
  await env.DB.put(key, String(n + 1), { expirationTtl: ttl })
  return true
}

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
function cleanMessages(input) {
  if (!Array.isArray(input)) return []
  return input
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map((m) => ({ role: m.role, content: stripControl(m.content).trim().slice(0, MAX_CHARS) }))
    .filter((m) => m.content)
    .slice(-MAX_TURNS)
}

export async function onRequestPost({ request, env }) {
  const url = new URL(request.url)
  try {
    if (!sameOrigin(request, url)) return json({ error: 'Bad origin.' }, 403)
    if (Number(request.headers.get('Content-Length') || 0) > 20000) return json({ error: 'Too large.' }, 413)
    let body
    try {
      body = await request.json()
    } catch {
      return json({ error: 'Invalid JSON.' }, 400)
    }
    const messages = cleanMessages(body?.messages)
    if (!messages.length || messages[messages.length - 1].role !== 'user') return json({ error: 'Ask a question first.' }, 400)

    if (!env.AI) return fallback('no-ai-binding')
    if (env.DB) {
      const ip = request.headers.get('CF-Connecting-IP') || 'local'
      const day = new Date().toISOString().slice(0, 10)
      if (!(await bump(env, `rl:ai:${ip}`, PER_IP_PER_HOUR, 3600))) return json({ error: 'Too many questions. Please try again later.' }, 429)
      if (!(await bump(env, `rl:ai:day:${day}`, PER_DAY_TOTAL, 90000))) return fallback('daily-limit')
    }

    const live = await liveContent(env)
    const prompt = [{ role: 'system', content: buildSystemPrompt(live) }, ...messages]
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
    return reply ? json({ reply }) : fallback('model-error')
  } catch (err) {
    console.error('assistant: unexpected error', String(err?.message || err).slice(0, 300))
    return fallback('error')
  }
}

// Open /api/assistant in a browser to check the setup. It only reports yes/no, never any secrets.
export async function onRequestGet({ env }) {
  return json({ ai: Boolean(env.AI), kv: Boolean(env.DB), model: MODEL })
}
