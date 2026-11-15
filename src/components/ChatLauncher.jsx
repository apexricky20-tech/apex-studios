import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useContact, useSite, useVisibleProjects } from '../lib/content'
import { waHref, waMessage } from '../lib/whatsapp'
import { getRef, getSource } from '../lib/utm'
import {
  BOOKING_INTENT,
  MAX_PHOTOS,
  SERVICE_CHOICES,
  WHEN_CHOICES,
  blobToDataUrl,
  cleanPhone,
  getFormToken,
  sendBooking,
  shrinkPhoto,
  thumbOf,
  uploadPhoto,
} from '../lib/booking'
import { ago, chatTitle, clearChats, loadStore, newId, removeChat, resumable, saveChat, setActive } from '../lib/chatStore'

// "Ney", the Apex Studios assistant: the floating pill, and the chat it opens.
// Answers come from /api/assistant (Cloudflare Workers AI). The panel says plainly that it is an AI assistant,
// and always shows WhatsApp and email so a visitor can reach the real person. Social links are given in the reply
// when a visitor asks for them. The conversation is kept in the visitor's own browser (see lib/chatStore.js).
// Avoid <p>, <li>, <h2>, <h3> and rounded-full links in here: Motion.jsx fades those in on every page change.

const chips = ['What do you build?', 'How much does it cost?', 'How long does a website take?']
const BOOK = 'Book a free call'
const PHOTO_ONLY = 'Please have a look at this photo.'
const PHOTO_SHRINK = { attempts: [[1024, 0.7], [800, 0.55], [640, 0.5]], maxBytes: 420 * 1024 }

const linkCls =
  'rounded-[999px] border border-paper/20 px-3.5 py-2 text-xs font-medium transition-colors hover:border-amber hover:text-amber'
const iconBtn =
  'grid h-8 w-8 shrink-0 place-items-center rounded-[50%] transition-colors disabled:opacity-40'

const SpeechRec = typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : undefined
const uid = () => Math.random().toString(36).slice(2, 10)

// Plain-language line about a published project that really has a 100 mobile performance score.
function proofLine(projects) {
  const p = projects.find((x) => x.slug === 'bullhead' && x.published !== false)
  const hit = (p?.results || []).some((r) => /pagespeed/i.test(r.label) && /performance\s*100/i.test(r.value))
  return hit
    ? 'By the way, we built the website for Bullhead Hotel, and it scores 100 for performance on mobile PageSpeed. Want to see how fast yours could load?'
    : ''
}

// Links in a reply (like our TikTok) are tappable. Only http(s) becomes a link; everything else stays text.
const URL_RE = /(https?:\/\/[^\s<>"')]+[^\s<>"').,;:!?])/g
function Linked({ text }) {
  return text.split(URL_RE).map((part, i) =>
    i % 2 === 1 ? (
      <a key={i} href={part} target="_blank" rel="noreferrer noopener" className="break-all underline underline-offset-2 hover:text-amber">
        {part}
      </a>
    ) : (
      part
    ),
  )
}

// Ney's photo, with the "N" monogram underneath as the fallback if the image ever fails to load.
function Avatar({ size }) {
  return (
    <span className="relative shrink-0" style={{ width: size, height: size }}>
      <span className="relative block h-full w-full overflow-hidden rounded-[50%] bg-amber ring-1 ring-paper/30">
        <span
          aria-hidden="true"
          className="absolute inset-0 grid place-items-center font-semibold text-ink"
          style={{ fontSize: Math.round(size * 0.46) }}
        >
          N
        </span>
        <img
          src="/ney.webp"
          alt=""
          width={size}
          height={size}
          className="absolute inset-0 h-full w-full object-cover"
          onError={(e) => {
            e.currentTarget.style.visibility = 'hidden'
          }}
        />
      </span>
      <span
        aria-hidden="true"
        className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-[50%] border-2 border-ink bg-[#12b76a]"
      >
        <span className="radar-pulse absolute h-full w-full rounded-[50%] bg-[#12b76a]" />
      </span>
    </span>
  )
}

const Icon = ({ children }) => (
  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
)

export default function ChatLauncher() {
  const site = useSite()
  const contact = useContact()
  const { pathname } = useLocation()
  const projects = useVisibleProjects()
  const first = String(site.name || 'us').split(' ')[0]

  const greeting = () => [
    {
      role: 'assistant',
      local: true,
      text: `Hi, I'm Ney, the assistant for Apex Studios. Ask me about what we build, M-Pesa payments or how a project works. For a quote, or to talk to ${first} himself, WhatsApp is fastest.`,
    },
  ]

  // Reopen the last chat if it was used recently; otherwise start fresh.
  const [boot] = useState(() => {
    const saved = resumable(loadStore())
    return { id: saved?.id || newId(), messages: saved?.messages || null }
  })
  const [chatId, setChatId] = useState(boot.id)
  const [messages, setMessages] = useState(() => boot.messages || greeting())
  const loaded = useRef(boot.messages)
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(false)
  const [view, setView] = useState('chat') // 'chat' | 'recent'
  const [store, setStore] = useState({ chats: [] })
  const [now, setNow] = useState(0)
  const [busy, setBusy] = useState(false)
  const [text, setText] = useState('')
  const [listening, setListening] = useState(false)
  const [voiceErr, setVoiceErr] = useState('')
  const [pending, setPending] = useState(null) // { dataUrl, thumb }: a photo picked for the assistant, not sent yet
  const [preparing, setPreparing] = useState(false)
  const [photoErr, setPhotoErr] = useState('')
  const nudged = useRef(Boolean(boot.messages?.some((m) => m.proof)))
  const runId = useRef(0) // bumped when the chat is switched so a late reply from the old chat is dropped
  const recRef = useRef(null)
  const openRef = useRef(false)
  // Booking: null, or { step, data }. Steps: name, phone, service, when, note, photos, review, sending.
  const [booking, setBooking] = useState(null)
  const [photos, setPhotos] = useState([]) // [{ id, name }] already uploaded for this request
  const [uploading, setUploading] = useState(false)
  const token = useRef(null)
  const fileRef = useRef(null)
  const pillRef = useRef(null)
  const panelRef = useRef(null)
  const inputRef = useRef(null)
  const logRef = useRef(null)
  const wasOpen = useRef(false)

  useEffect(() => {
    openRef.current = open
    if (open) inputRef.current?.focus()
    else if (wasOpen.current) pillRef.current?.focus()
    wasOpen.current = open
  }, [open])

  // Escape, or a tap anywhere outside the panel, tucks the chat away. It stays mounted, so nothing is lost.
  useEffect(() => {
    if (!open) return
    const collapse = () => {
      recRef.current?.stop()
      setOpen(false)
    }
    const onKey = (e) => e.key === 'Escape' && collapse()
    const onDown = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) collapse()
    }
    window.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onDown)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onDown)
    }
  }, [open])

  useEffect(() => {
    const el = logRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, busy, open, view])

  // Keep the conversation in this browser. Skipped for the untouched chat that was just loaded.
  useEffect(() => {
    if (messages === loaded.current) return
    saveChat(chatId, messages)
  }, [chatId, messages])

  // The WhatsApp button always carries what the visitor was just asking about (real questions only, not canned replies).
  const lastQuestion = [...messages].reverse().find((m) => m.role === 'user' && !m.local)?.text
  const chat = waHref(
    contact.whatsapp,
    lastQuestion
      ? `Hi ${first}, I was just chatting with your site assistant about: ${lastQuestion}`
      : waMessage(pathname),
  )
  // Only WhatsApp and email as buttons: every other link is a way out of the conversation. Ney gives social links in the reply when asked.
  const links = [
    chat && { label: 'WhatsApp', href: chat, primary: true },
    contact.email && { label: 'Email', href: `mailto:${contact.email}` },
  ].filter(Boolean)

  const toApi = (list) =>
    list
      .filter((m) => !m.local)
      .map((m) => ({ role: m.role, content: m.text || (m.thumb ? PHOTO_ONLY : ''), ...(m.seen ? { seen: m.seen } : {}) }))

  const ask = async (raw) => {
    const q = raw.trim().slice(0, 400)
    const photo = booking ? null : pending
    if ((!q && !photo) || busy || uploading || preparing) return
    stopVoice()
    if (booking) return answerBooking(q)
    if (!photo && (q === BOOK || BOOKING_INTENT.test(q))) return startBooking(q)
    setText('')
    setPending(null)
    setPhotoErr('')
    const id = runId.current
    const mid = photo ? uid() : ''
    const next = [...messages, { role: 'user', text: q, ...(photo ? { thumb: photo.thumb, mid } : {}) }]
    setMessages(next)
    setBusy(true)
    const reply = (add, seen) => {
      if (!openRef.current) setUnread(true)
      setMessages((m) => {
        const marked = seen ? m.map((x) => (x.mid && x.mid === mid ? { ...x, seen } : x)) : m
        return [...marked, ...add]
      })
    }
    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: toApi(next), ...(photo ? { image: photo.dataUrl } : {}) }),
      })
      const data = await res.json().catch(() => ({}))
      if (id !== runId.current) return
      if (!res.ok && data.error && [400, 413, 429].includes(res.status)) return reply([{ role: 'assistant', local: true, text: data.error }])
      if (!res.ok || !data.reply) throw new Error('no reply')
      const add = [{ role: 'assistant', text: data.reply, local: Boolean(data.fallback) }]
      // Second real question: one fixed proof line, written by us (never by the model), once per chat.
      const asked = next.filter((m) => m.role === 'user' && !m.local).length
      const proof = proofLine(projects)
      if (asked >= 2 && proof && !nudged.current && !data.fallback) {
        nudged.current = true
        add.push({ role: 'assistant', text: proof, local: true, proof: true })
      }
      reply(add, data.seen)
    } catch {
      if (id !== runId.current) return
      reply([
        {
          role: 'assistant',
          local: true,
          text: `We couldn't reach our assistant just now. WhatsApp is the fastest way to reach ${first}.`,
        },
      ])
    } finally {
      if (id === runId.current) setBusy(false)
    }
  }

  // ---------- booking ----------
  const say = (t) => setMessages((m) => [...m, { role: 'assistant', local: true, text: t }])
  const youSay = (t) => setMessages((m) => [...m, { role: 'user', local: true, text: t }])

  const startBooking = (q) => {
    setText('')
    setPending(null)
    token.current = null
    getFormToken().then((t) => (token.current = t))
    setPhotos([])
    setBooking({ step: 'name', data: {} })
    setMessages((m) => [
      ...m,
      { role: 'user', local: true, text: q },
      { role: 'assistant', local: true, text: `Happy to set that up. It takes about a minute, and ${first} will confirm a time personally. What's your name?` },
    ])
  }

  const cancelBooking = () => {
    setBooking(null)
    setPhotos([])
    say('No problem, nothing was sent. Ask us anything, or tap Book a free call whenever you like.')
  }

  const answerBooking = (raw) => {
    const q = raw.trim()
    if (!q || !booking) return
    const { step, data } = booking
    setText('')
    if (step === 'photos' || step === 'review' || step === 'sending') {
      youSay(q)
      return say('Please use the buttons above to continue, or tap Cancel.')
    }
    const go = (nextStep, patch, prompt) => {
      youSay(q)
      setBooking({ step: nextStep, data: { ...data, ...patch } })
      say(prompt)
    }
    if (step === 'name') return go('phone', { name: q.slice(0, 80) }, `Thanks ${q.split(' ')[0].slice(0, 30)}. What phone number should ${first} call or WhatsApp? For example 0712 345 678.`)
    if (step === 'phone') {
      const phone = cleanPhone(q)
      if (!phone) {
        youSay(q)
        return say('That does not look like a full phone number. Please type it again, for example 0712 345 678.')
      }
      return go('service', { phone }, 'What do you need help with?')
    }
    if (step === 'service') return go('when', { service: q.slice(0, 60) }, 'When is a good time for the call? Tap an option or type your own, like Friday afternoon.')
    if (step === 'when') return go('note', { when: q.slice(0, 80) }, `Anything ${first} should know first, such as your business name or website link? Type it, or tap Skip.`)
    if (step === 'note') {
      return go('photos', { note: /^skip$/i.test(q) ? '' : q.slice(0, 300) }, 'Want to add up to 3 photos, like your current website, menu, rooms or logo? It is optional.')
    }
  }

  const choose = (value) => answerBooking(value)

  const toReview = () => {
    youSay(photos.length ? `${photos.length} photo${photos.length === 1 ? '' : 's'} added` : 'No photos')
    setBooking((b) => ({ ...b, step: 'review' }))
    const d = booking.data
    say(
      [
        'Please check these details:',
        `Name: ${d.name}`,
        `Phone: ${d.phone}`,
        `Need: ${d.service}`,
        `Time: ${d.when}`,
        d.note ? `Note: ${d.note}` : null,
        `Photos: ${photos.length}`,
        '',
        `Send this to ${first}?`,
      ]
        .filter((l) => l !== null)
        .join('\n'),
    )
  }

  // Booking photos are stored for Jawan (private, auto-deleted). They are not read by the assistant.
  const addPhotos = async (e) => {
    const files = [...(e.target.files || [])].slice(0, MAX_PHOTOS - photos.length)
    e.target.value = ''
    if (!files.length) return
    setUploading(true)
    const done = []
    for (const f of files) {
      try {
        done.push({ id: await uploadPhoto(await shrinkPhoto(f)), name: f.name })
      } catch (err) {
        say(`${f.name}: ${err.message}`)
      }
    }
    setPhotos((p) => [...p, ...done])
    setUploading(false)
  }

  // A photo for Ney to look at: shrunk in the browser, shown as a preview, sent with the next message.
  const pickPhoto = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setPhotoErr('')
    setPreparing(true)
    try {
      const blob = await shrinkPhoto(file, PHOTO_SHRINK)
      const [dataUrl, thumb] = await Promise.all([blobToDataUrl(blob), thumbOf(blob)])
      setPending({ dataUrl, thumb })
      inputRef.current?.focus()
    } catch (err) {
      setPhotoErr(err.message)
    } finally {
      setPreparing(false)
    }
  }

  const onFile = (e) => (booking?.step === 'photos' ? addPhotos(e) : pickPhoto(e))

  const submitBooking = async () => {
    setBooking((b) => ({ ...b, step: 'sending' }))
    try {
      await sendBooking({
        data: booking.data,
        photos: photos.map((p) => p.id),
        first,
        page: pathname,
        source: getSource(),
        referrer: getRef(),
        token: token.current,
      })
      youSay('Send it')
      say(`Sent. ${first} will confirm a time personally on ${booking.data.phone}. You do not need to do anything else.`)
      setBooking(null)
      setPhotos([])
    } catch (err) {
      setBooking((b) => ({ ...b, step: 'review' }))
      say(`${err.message} You can try again, or WhatsApp ${first} using the green button below.`)
    }
  }

  const stopVoice = () => {
    recRef.current?.stop()
    recRef.current = null
    setListening(false)
  }

  // Voice input = dictation into the box. The visitor reads it and taps Send, so a mishearing never goes out by itself.
  const toggleVoice = () => {
    if (listening) return stopVoice()
    setVoiceErr('')
    const rec = new SpeechRec()
    rec.lang = navigator.language?.startsWith('sw') ? 'sw-KE' : 'en-KE'
    rec.interimResults = true
    rec.continuous = false
    const base = text ? `${text.trim()} ` : ''
    rec.onresult = (e) => {
      const heard = [...e.results].map((r) => r[0].transcript).join('')
      setText(`${base}${heard}`.slice(0, 400))
    }
    rec.onerror = (e) => {
      setListening(false)
      recRef.current = null
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') setVoiceErr('Microphone is blocked. Allow it in your browser, or type instead.')
      else if (e.error !== 'aborted' && e.error !== 'no-speech') setVoiceErr('Voice did not work. Please type instead.')
    }
    rec.onend = () => {
      setListening(false)
      recRef.current = null
      inputRef.current?.focus()
    }
    try {
      rec.start()
      recRef.current = rec
      setListening(true)
    } catch {
      setVoiceErr('Voice did not work. Please type instead.')
    }
  }

  // Everything that belongs to one conversation, reset when switching to another (or to a new one).
  const switchTo = (id, list) => {
    stopVoice()
    runId.current += 1
    nudged.current = list.some((m) => m.proof)
    setBooking(null)
    setPhotos([])
    setUploading(false)
    setPending(null)
    setPreparing(false)
    setPhotoErr('')
    setBusy(false)
    setText('')
    setVoiceErr('')
    setChatId(id)
    setMessages(list)
    setView('chat')
    inputRef.current?.focus()
  }

  const newChat = () => {
    setActive('')
    switchTo(newId(), greeting())
  }

  const resume = (c) => {
    setActive(c.id)
    switchTo(c.id, c.messages)
  }

  const openRecent = () => {
    if (view === 'recent') return setView('chat')
    saveChat(chatId, messages)
    setStore(loadStore())
    setNow(Date.now())
    setView('recent')
  }

  const forget = (id) => {
    removeChat(id)
    if (id === chatId) return newChat()
    setStore(loadStore())
  }

  const forgetAll = () => {
    newChat()
    clearChats()
    setStore({ chats: [] })
  }

  const askForPerson = () => {
    setMessages((m) => [
      ...m,
      { role: 'user', local: true, text: `Can I speak to ${first}?` },
      {
        role: 'assistant',
        local: true,
        text: `Yes. WhatsApp is the fastest way, and ${first} replies there personally. Tap the green WhatsApp button below, or use email if you prefer.`,
      },
    ])
  }

  const canPhoto = !booking || booking.step === 'photos'
  const noInput = busy || uploading || preparing || booking?.step === 'sending'

  return (
    <>
      {!open && (
        <button
          ref={pillRef}
          type="button"
          onClick={() => {
            setUnread(false)
            setOpen(true)
          }}
          aria-haspopup="dialog"
          aria-expanded="false"
          aria-controls="apex-chat"
          className="chat-launcher fixed bottom-5 right-5 z-40 flex items-center gap-3 rounded-[999px] bg-ink/90 py-2 pl-2 pr-5 text-left shadow-lg shadow-black/50 backdrop-blur transition-transform hover:scale-[1.03] md:bottom-8 md:right-8"
        >
          <Avatar size={44} />
          <span className="leading-tight">
            <span className="block text-sm font-semibold">Chat with Ney</span>
            <span className="block text-xs text-paper/60">{unread ? 'New reply waiting' : 'Apex Studios assistant · online'}</span>
          </span>
          {unread && <span aria-hidden="true" className="absolute right-3 top-2 h-2.5 w-2.5 rounded-[50%] bg-amber" />}
        </button>
      )}

      {open && (
        <section
          ref={panelRef}
          id="apex-chat"
          role="dialog"
          aria-label="Chat with Ney, the Apex Studios assistant"
          className="chat-panel fixed bottom-5 right-5 z-50 flex max-h-[min(640px,calc(100svh-2.5rem))] w-[calc(100vw-2.5rem)] max-w-[380px] flex-col overflow-hidden rounded-3xl border border-paper/15 bg-surface shadow-2xl shadow-black/60 md:bottom-8 md:right-8"
        >
          <div className="flex items-center gap-2.5 border-b border-paper/10 px-4 py-3">
            <Avatar size={40} />
            <div className="min-w-0 flex-1 leading-tight">
              <div className="truncate text-sm font-semibold">{view === 'recent' ? 'Recent chats' : 'Ney'}</div>
              <div className="truncate text-xs text-paper/60">Apex Studios · AI</div>
            </div>
            <button
              type="button"
              onClick={openRecent}
              disabled={busy}
              aria-label={view === 'recent' ? 'Back to the chat' : 'Recent chats'}
              aria-pressed={view === 'recent'}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-[50%] border border-paper/20 transition-colors hover:border-amber hover:text-amber disabled:opacity-40"
            >
              <Icon>
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </Icon>
            </button>
            <button
              type="button"
              onClick={newChat}
              disabled={busy}
              className="shrink-0 rounded-[999px] border border-paper/20 px-3 py-1.5 text-xs transition-colors hover:border-amber hover:text-amber disabled:opacity-40"
            >
              New chat
            </button>
            <button
              type="button"
              onClick={() => {
                recRef.current?.stop()
                setOpen(false)
              }}
              aria-label="Close chat"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-[50%] border border-paper/20 transition-colors hover:border-amber hover:text-amber"
            >
              <Icon>
                <path d="M6 6l12 12M18 6L6 18" />
              </Icon>
            </button>
          </div>

          {view === 'recent' ? (
            <div data-lenis-prevent className="min-h-[220px] flex-1 space-y-2 overflow-y-auto px-4 py-4">
              {store.chats.length === 0 && <div className="text-sm text-paper/60">No saved chats yet. Your conversations are kept on this device only.</div>}
              {store.chats.map((c) => (
                <div key={c.id} className={`flex items-center gap-1 rounded-2xl border px-3 py-2 ${c.id === chatId ? 'border-amber/60' : 'border-paper/10'}`}>
                  <button type="button" onClick={() => resume(c)} className="min-w-0 flex-1 text-left">
                    <span className="block truncate text-sm">{chatTitle(c)}</span>
                    <span className="block text-xs text-paper/60">{ago(c.updated, now)}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => forget(c.id)}
                    aria-label={`Delete chat: ${chatTitle(c)}`}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-[50%] text-paper/60 transition-colors hover:text-amber"
                  >
                    <Icon>
                      <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12h10l1-12M9 7V4h6v3" />
                    </Icon>
                  </button>
                </div>
              ))}
              {store.chats.length > 0 && (
                <button type="button" onClick={forgetAll} className="px-1 pt-2 text-xs text-paper/60 underline hover:text-amber">
                  Delete all saved chats
                </button>
              )}
            </div>
          ) : (
            <div
              ref={logRef}
              role="log"
              aria-live="polite"
              data-lenis-prevent
              className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
            >
              {messages.map((m, i) => (
                <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                  <div
                    className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      m.role === 'user' ? 'bg-amber text-ink' : 'bg-paper/10 text-paper'
                    }`}
                  >
                    {m.thumb && <img src={m.thumb} alt="Photo you sent" className={`max-h-40 rounded-xl ${m.text ? 'mb-2' : ''}`} />}
                    <Linked text={m.text} />
                  </div>
                </div>
              ))}
              {busy && (
                <div className="flex justify-start">
                  <div className="rounded-2xl bg-paper/10 px-4 py-2.5 text-sm text-paper/60">{pending === null && messages.at(-1)?.thumb ? 'Looking at your photo…' : 'Typing…'}</div>
                </div>
              )}
              {!messages.some((m) => m.role === 'user') && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {chips.map((c) => (
                    <button key={c} type="button" onClick={() => ask(c)} className={linkCls}>
                      {c}
                    </button>
                  ))}
                  <button type="button" onClick={askForPerson} className={linkCls}>
                    {`Can I speak to ${first}?`}
                  </button>
                </div>
              )}
              {booking && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {booking.step === 'service' && SERVICE_CHOICES.map((c) => (
                    <button key={c} type="button" onClick={() => choose(c)} className={linkCls}>
                      {c}
                    </button>
                  ))}
                  {booking.step === 'when' && WHEN_CHOICES.map((c) => (
                    <button key={c} type="button" onClick={() => choose(c)} className={linkCls}>
                      {c}
                    </button>
                  ))}
                  {booking.step === 'note' && (
                    <button type="button" onClick={() => choose('Skip')} className={linkCls}>
                      Skip
                    </button>
                  )}
                  {booking.step === 'photos' && (
                    <>
                      {photos.length < MAX_PHOTOS && (
                        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className={`${linkCls} disabled:opacity-40`}>
                          {uploading ? 'Uploading...' : photos.length ? 'Add another photo' : 'Add photos'}
                        </button>
                      )}
                      <button type="button" onClick={toReview} disabled={uploading} className={`${linkCls} disabled:opacity-40`}>
                        {photos.length ? `Continue (${photos.length} added)` : 'Skip photos'}
                      </button>
                    </>
                  )}
                  {(booking.step === 'review' || booking.step === 'sending') && (
                    <>
                      <button
                        type="button"
                        onClick={submitBooking}
                        disabled={booking.step === 'sending'}
                        className="rounded-[999px] bg-amber px-3.5 py-2 text-xs font-semibold text-ink transition-opacity hover:opacity-90 disabled:opacity-40"
                      >
                        {booking.step === 'sending' ? 'Sending...' : 'Send it'}
                      </button>
                      <button type="button" onClick={() => startBooking('Start over')} disabled={booking.step === 'sending'} className={`${linkCls} disabled:opacity-40`}>
                        Start over
                      </button>
                    </>
                  )}
                  {booking.step !== 'sending' && (
                    <button type="button" onClick={cancelBooking} className="px-2 py-2 text-xs text-paper/60 underline hover:text-amber">
                      Cancel
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {view === 'chat' && (
            <div className="border-t border-paper/10 px-4 pb-3 pt-3">
              <div className="mb-2 text-xs text-paper/60">{`Talk to ${first} directly`}</div>
              <div className="flex flex-wrap gap-2">
                {!booking && (
                  <button type="button" onClick={() => ask(BOOK)} className="rounded-[999px] bg-amber px-3.5 py-2 text-xs font-semibold text-ink transition-opacity hover:opacity-90">
                    {BOOK}
                  </button>
                )}
                {links.map((l) => (
                  <a
                    key={l.label}
                    href={l.href}
                    target={l.href.startsWith('http') ? '_blank' : undefined}
                    rel="noreferrer"
                    className={
                      l.primary
                        ? 'rounded-[999px] bg-[#25D366] px-3.5 py-2 text-xs font-semibold text-black transition-opacity hover:opacity-90'
                        : linkCls
                    }
                  >
                    {l.label}
                  </a>
                ))}
              </div>
              {(pending || preparing) && (
                <div className="mt-3 flex items-center gap-3">
                  {pending ? (
                    <img src={pending.thumb} alt="Photo ready to send" className="h-12 w-12 rounded-xl object-cover" />
                  ) : null}
                  <span className="min-w-0 flex-1 text-xs text-paper/70">{preparing ? 'Preparing your photo…' : 'Photo ready. Add a question, or just tap Send.'}</span>
                  {pending && (
                    <button
                      type="button"
                      onClick={() => setPending(null)}
                      aria-label="Remove photo"
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-[50%] border border-paper/20 transition-colors hover:border-amber hover:text-amber"
                    >
                      <Icon>
                        <path d="M6 6l12 12M18 6L6 18" />
                      </Icon>
                    </button>
                  )}
                </div>
              )}
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  ask(text)
                }}
                className="mt-3 flex items-center gap-2"
              >
                <label htmlFor="apex-chat-input" className="sr-only">
                  Your question
                </label>
                <div className="flex min-w-0 flex-1 items-center gap-0.5 rounded-[999px] border border-paper/20 pl-4 pr-1 transition-colors focus-within:border-amber">
                  <input
                    id="apex-chat-input"
                    ref={inputRef}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    maxLength={400}
                    autoComplete="off"
                    placeholder={listening ? 'Listening...' : pending ? 'Ask about the photo (optional)' : booking ? 'Type your answer' : 'Type your question'}
                    inputMode={booking?.step === 'phone' ? 'tel' : 'text'}
                    className="min-w-0 flex-1 bg-transparent py-2.5 text-sm outline-none placeholder:text-paper/40"
                  />
                  {canPhoto && (
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      disabled={noInput}
                      aria-label={booking?.step === 'photos' ? 'Add a photo to your request' : 'Attach a photo for Ney to look at'}
                      className={`${iconBtn} text-paper/70 hover:text-amber`}
                    >
                      <Icon>
                        <rect x="3" y="5" width="18" height="14" rx="3" />
                        <circle cx="9" cy="10.5" r="1.6" />
                        <path d="M21 16l-5-5-8 8" />
                      </Icon>
                    </button>
                  )}
                  {SpeechRec && (
                    <button
                      type="button"
                      onClick={toggleVoice}
                      aria-label={listening ? 'Stop voice input' : 'Speak your question'}
                      aria-pressed={listening}
                      className={`${iconBtn} ${listening ? 'bg-amber text-ink' : 'text-paper/70 hover:text-amber'}`}
                    >
                      <Icon>
                        <rect x="9" y="3" width="6" height="11" rx="3" />
                        <path d="M5 11a7 7 0 0014 0M12 18v3" />
                      </Icon>
                    </button>
                  )}
                  <input ref={fileRef} type="file" accept="image/*" multiple={booking?.step === 'photos'} onChange={onFile} className="hidden" tabIndex={-1} aria-hidden="true" />
                </div>
                <button
                  type="submit"
                  disabled={noInput || (!text.trim() && !(pending && !booking))}
                  className="rounded-[999px] bg-paper px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-amber disabled:opacity-40"
                >
                  Send
                </button>
              </form>
              {(voiceErr || photoErr) && (
                <div role="status" className="mt-2 text-xs text-amber">
                  {photoErr || voiceErr}
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </>
  )
}
