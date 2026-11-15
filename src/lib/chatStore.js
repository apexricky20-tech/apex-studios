// Saves the chat in the visitor's own browser (localStorage), so closing the panel, reloading or coming back later
// does not lose the conversation. Nothing here is sent to us. Plain helpers, no React.
const KEY = 'apex-chats-v1'
const MAX_CHATS = 10
const MAX_MSGS = 60
export const RESUME_MS = 12 * 60 * 60 * 1000 // an untouched chat is reopened automatically for this long

export const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`

const empty = () => ({ active: '', chats: [] })

// localStorage can hold anything, so every field is re-checked on the way in.
function cleanMessage(m) {
  if (!m || (m.role !== 'user' && m.role !== 'assistant') || typeof m.text !== 'string') return null
  const out = { role: m.role, text: m.text.slice(0, 800) }
  if (m.local) out.local = true
  if (m.proof) out.proof = true
  if (typeof m.seen === 'string' && m.seen) out.seen = m.seen.slice(0, 700)
  if (typeof m.thumb === 'string' && m.thumb.startsWith('data:image/') && m.thumb.length < 30000) out.thumb = m.thumb
  return out
}

function read() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY) || 'null')
    if (!d || !Array.isArray(d.chats)) return empty()
    const chats = d.chats
      .filter((c) => c && typeof c.id === 'string' && Array.isArray(c.messages) && Number.isFinite(c.updated))
      .map((c) => ({ id: c.id, updated: c.updated, messages: c.messages.map(cleanMessage).filter(Boolean).slice(-MAX_MSGS) }))
      .filter((c) => c.messages.some((m) => m.role === 'user'))
      .slice(0, MAX_CHATS)
    return { active: typeof d.active === 'string' ? d.active : '', chats }
  } catch {
    return empty()
  }
}

function write(d) {
  try {
    localStorage.setItem(KEY, JSON.stringify(d))
    return true
  } catch {
    return false
  }
}

export const loadStore = read

// The chat to reopen on page load, or null for a fresh one.
export function resumable(store, now = Date.now()) {
  const c = store.chats.find((x) => x.id === store.active)
  return c && now - c.updated < RESUME_MS ? c : null
}

export function saveChat(id, messages) {
  if (!messages.some((m) => m.role === 'user')) return
  const d = read()
  const entry = { id, updated: Date.now(), messages: messages.slice(-MAX_MSGS).map(cleanMessage).filter(Boolean) }
  const next = { active: id, chats: [entry, ...d.chats.filter((c) => c.id !== id)].slice(0, MAX_CHATS) }
  if (write(next)) return
  // Storage full: thumbnails are the heavy part. Drop them from everything but retry, then give up quietly.
  const lean = { ...next, chats: next.chats.map((c) => ({ ...c, messages: c.messages.map(({ thumb, ...m }) => m) })) } // eslint-disable-line no-unused-vars
  write(lean)
}

export function setActive(id) {
  const d = read()
  write({ ...d, active: id })
}

export function removeChat(id) {
  const d = read()
  write({ active: d.active === id ? '' : d.active, chats: d.chats.filter((c) => c.id !== id) })
}

export function clearChats() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // nothing to clear
  }
}

export const chatTitle = (c) => {
  const m = c.messages.find((x) => x.role === 'user')
  return (m?.text || (m?.thumb ? 'Photo' : 'Chat')).slice(0, 48)
}

export function ago(ts, now) {
  const mins = Math.max(0, Math.round((now - ts) / 60000))
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const h = Math.round(mins / 60)
  if (h < 24) return `${h} h ago`
  const days = Math.round(h / 24)
  return days === 1 ? 'yesterday' : `${days} days ago`
}
