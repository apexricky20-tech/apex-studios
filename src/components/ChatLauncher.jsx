import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useContact, useSite, useVisibleProjects } from '../lib/content'
import { waHref, waMessage } from '../lib/whatsapp'

// The floating "Ask Jawan a question" pill, and the chat it opens.
// Answers come from /api/assistant (Cloudflare Workers AI). The panel says plainly that it is an AI assistant,
// and always shows WhatsApp and email so a visitor can reach the real person (socials are left out on purpose).
// Avoid <p>, <li>, <h2>, <h3> and rounded-full links in here: Motion.jsx fades those in on every page change.

const chips = ['What do you build?', 'How much does it cost?', 'How long does a website take?']

const linkCls =
  'rounded-[999px] border border-paper/20 px-3.5 py-2 text-xs font-medium transition-colors hover:border-amber hover:text-amber'

const SpeechRec = typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : undefined

// Plain-language line about a published project that really has a 100 mobile performance score.
function proofLine(projects) {
  const p = projects.find((x) => x.slug === 'bullhead' && x.published !== false)
  const hit = (p?.results || []).some((r) => /pagespeed/i.test(r.label) && /performance\s*100/i.test(r.value))
  return hit
    ? 'By the way, we built the website for Bullhead Hotel, and it scores 100 for performance on mobile PageSpeed. Want to see how fast yours could load?'
    : ''
}

function Avatar({ src, size }) {
  return (
    <span className="relative shrink-0" style={{ width: size, height: size }}>
      <span className="block h-full w-full overflow-hidden rounded-[50%] bg-surface ring-1 ring-paper/30">
        <img
          src={src}
          alt=""
          width={size}
          height={size}
          className="h-full w-full object-cover brightness-125"
          style={{ transform: 'scale(2.1)', transformOrigin: '62% 27%' }}
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

export default function ChatLauncher() {
  const site = useSite()
  const contact = useContact()
  const { pathname } = useLocation()
  const projects = useVisibleProjects()
  const first = String(site.name || 'us').split(' ')[0]

  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [text, setText] = useState('')
  const greeting = () => [
    {
      role: 'assistant',
      local: true,
      text: `Hi, I'm the Apex Studios assistant. Ask me about websites, M-Pesa payments or how a project works. For a quote, or to talk to ${first} himself, WhatsApp is fastest.`,
    },
  ]
  const [messages, setMessages] = useState(greeting)
  const [listening, setListening] = useState(false)
  const [voiceErr, setVoiceErr] = useState('')
  const nudged = useRef(false)
  const runId = useRef(0) // bumped by "New chat" so a late reply from the old chat is dropped
  const recRef = useRef(null)
  const pillRef = useRef(null)
  const inputRef = useRef(null)
  const logRef = useRef(null)
  const wasOpen = useRef(false)

  useEffect(() => {
    if (open) inputRef.current?.focus()
    else if (wasOpen.current) pillRef.current?.focus()
    wasOpen.current = open
  }, [open])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    const el = logRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, busy, open])

  // The WhatsApp button always carries what the visitor was just asking about (real questions only, not canned replies).
  const lastQuestion = [...messages].reverse().find((m) => m.role === 'user' && !m.local)?.text
  const chat = waHref(
    contact.whatsapp,
    lastQuestion
      ? `Hi ${first}, I was just chatting with your site assistant about: ${lastQuestion}`
      : waMessage(pathname),
  )
  // Only WhatsApp and email: every other link is a way out of the conversation.
  const links = [
    chat && { label: 'WhatsApp', href: chat, primary: true },
    contact.email && { label: 'Email', href: `mailto:${contact.email}` },
  ].filter(Boolean)

  const ask = async (raw) => {
    const q = raw.trim().slice(0, 400)
    if (!q || busy) return
    stopVoice()
    setText('')
    const id = runId.current
    const next = [...messages, { role: 'user', text: q }]
    setMessages(next)
    setBusy(true)
    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: next.filter((m) => !m.local).map((m) => ({ role: m.role, content: m.text })),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.reply) throw new Error('no reply')
      if (id !== runId.current) return
      const add = [{ role: 'assistant', text: data.reply, local: Boolean(data.fallback) }]
      // Second real question: one fixed proof line, written by us (never by the model), once per chat.
      const asked = next.filter((m) => m.role === 'user' && !m.local).length
      const proof = proofLine(projects)
      if (asked >= 2 && proof && !nudged.current && !data.fallback) {
        nudged.current = true
        add.push({ role: 'assistant', text: proof, local: true })
      }
      setMessages((m) => [...m, ...add])
    } catch {
      if (id !== runId.current) return
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          local: true,
          text: `I couldn't reach the assistant just now. WhatsApp is the fastest way to reach ${first}.`,
        },
      ])
    } finally {
      if (id === runId.current) setBusy(false)
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

  const newChat = () => {
    stopVoice()
    runId.current += 1
    nudged.current = false
    setBusy(false)
    setText('')
    setVoiceErr('')
    setMessages(greeting())
    inputRef.current?.focus()
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

  return (
    <>
      {!open && (
        <button
          ref={pillRef}
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded="false"
          aria-controls="apex-chat"
          className="chat-launcher fixed bottom-5 right-5 z-40 flex items-center gap-3 rounded-[999px] bg-ink/90 py-2 pl-2 pr-5 text-left shadow-lg shadow-black/50 backdrop-blur transition-transform hover:scale-[1.03] md:bottom-8 md:right-8"
        >
          <Avatar src={site.portrait} size={44} />
          <span className="leading-tight">
            <span className="block text-sm font-semibold">Ask {first} a question</span>
            <span className="block text-xs text-paper/60">Online · replies instantly</span>
          </span>
        </button>
      )}

      {open && (
        <section
          id="apex-chat"
          role="dialog"
          aria-label="Chat with the Apex Studios assistant"
          className="chat-panel fixed bottom-5 right-5 z-50 flex max-h-[min(640px,calc(100svh-2.5rem))] w-[calc(100vw-2.5rem)] max-w-[380px] flex-col overflow-hidden rounded-3xl border border-paper/15 bg-surface shadow-2xl shadow-black/60 md:bottom-8 md:right-8"
        >
          <div className="flex items-center gap-3 border-b border-paper/10 px-4 py-3">
            <Avatar src={site.portrait} size={40} />
            <div className="min-w-0 flex-1 leading-tight">
              <div className="truncate text-sm font-semibold">Apex Studios assistant</div>
              <div className="text-xs text-paper/60">AI assistant · answers instantly</div>
            </div>
            <button
              type="button"
              onClick={newChat}
              disabled={busy}
              className="rounded-[999px] border border-paper/20 px-3 py-1.5 text-xs transition-colors hover:border-amber hover:text-amber disabled:opacity-40"
            >
              New chat
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="grid h-9 w-9 place-items-center rounded-[50%] border border-paper/20 transition-colors hover:border-amber hover:text-amber"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

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
                  {m.text}
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-paper/10 px-4 py-2.5 text-sm text-paper/60">Typing…</div>
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
          </div>

          <div className="border-t border-paper/10 px-4 pb-3 pt-3">
            <div className="mb-2 text-xs text-paper/60">{`Talk to ${first} directly. Photos and files are easiest on WhatsApp.`}</div>
            <div className="flex flex-wrap gap-2">
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
              <input
                id="apex-chat-input"
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={400}
                autoComplete="off"
                placeholder={listening ? 'Listening...' : 'Type your question'}
                className="min-w-0 flex-1 rounded-[999px] border border-paper/20 bg-transparent px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-paper/40 focus:border-amber"
              />
              {SpeechRec && (
                <button
                  type="button"
                  onClick={toggleVoice}
                  aria-label={listening ? 'Stop voice input' : 'Speak your question'}
                  aria-pressed={listening}
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-[50%] border transition-colors ${
                    listening ? 'border-amber bg-amber text-ink' : 'border-paper/20 hover:border-amber hover:text-amber'
                  }`}
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <rect x="9" y="3" width="6" height="11" rx="3" />
                    <path d="M5 11a7 7 0 0014 0M12 18v3" />
                  </svg>
                </button>
              )}
              <button
                type="submit"
                disabled={busy || !text.trim()}
                className="rounded-[999px] bg-paper px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-amber disabled:opacity-40"
              >
                Send
              </button>
            </form>
            {voiceErr && (
              <div role="status" className="mt-2 text-xs text-amber">
                {voiceErr}
              </div>
            )}
          </div>
        </section>
      )}
    </>
  )
}
