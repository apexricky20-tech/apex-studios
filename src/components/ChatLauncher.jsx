import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useContact, useSite } from '../lib/content'
import { waHref, waMessage } from '../lib/whatsapp'

// The floating "Ask Jawan a question" pill, and the chat it opens.
// Answers come from /api/assistant (Cloudflare Workers AI). The panel says plainly that it is an AI assistant,
// and always shows WhatsApp and the social links so a visitor can reach the real person.
// Avoid <p>, <li>, <h2>, <h3> and rounded-full links in here: Motion.jsx fades those in on every page change.

const chips = ['What do you build?', 'How much does it cost?', 'How long does a website take?']

const linkCls =
  'rounded-[999px] border border-paper/20 px-3.5 py-2 text-xs font-medium transition-colors hover:border-amber hover:text-amber'

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
        <span className="absolute h-full w-full rounded-[50%] bg-[#12b76a] opacity-60 motion-safe:animate-ping" />
      </span>
    </span>
  )
}

export default function ChatLauncher() {
  const site = useSite()
  const contact = useContact()
  const { pathname } = useLocation()
  const first = String(site.name || 'us').split(' ')[0]

  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [text, setText] = useState('')
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      local: true,
      text: `Hi, I'm the Apex Studios assistant. Ask me about websites, M-Pesa payments or how a project works. For a quote, or to talk to ${first} himself, WhatsApp is fastest.`,
    },
  ])
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

  const lastQuestion = [...messages].reverse().find((m) => m.role === 'user')?.text
  const chat = waHref(
    contact.whatsapp,
    lastQuestion ? `Hi Apex Studios, I was chatting on your website. My question: ${lastQuestion}` : waMessage(pathname),
  )
  const links = [
    chat && { label: 'WhatsApp', href: chat, primary: true },
    contact.instagram && { label: 'Instagram', href: contact.instagram },
    contact.tiktok && { label: 'TikTok', href: contact.tiktok },
    contact.youtube && { label: 'YouTube', href: contact.youtube },
    contact.email && { label: 'Email', href: `mailto:${contact.email}` },
  ].filter(Boolean)

  const ask = async (raw) => {
    const q = raw.trim().slice(0, 400)
    if (!q || busy) return
    setText('')
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
      setMessages((m) => [...m, { role: 'assistant', text: data.reply, local: Boolean(data.fallback) }])
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          local: true,
          text: `I couldn't reach the assistant just now. WhatsApp is the fastest way to reach ${first}.`,
        },
      ])
    } finally {
      setBusy(false)
    }
  }

  const askForPerson = () => {
    setMessages((m) => [
      ...m,
      { role: 'user', local: true, text: `Can I speak to ${first}?` },
      {
        role: 'assistant',
        local: true,
        text: `Yes. WhatsApp is the fastest way, and ${first} replies there personally. Tap WhatsApp below, or use Instagram or email if you prefer.`,
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
          className="chat-launcher fixed bottom-5 right-5 z-40 flex items-center gap-3 rounded-[999px] border border-paper/20 bg-ink/90 py-2 pl-2 pr-5 text-left shadow-lg shadow-black/50 backdrop-blur transition-transform hover:scale-[1.03] md:bottom-8 md:right-8"
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
            <div className="mb-2 text-xs text-paper/60">{`Talk to ${first} directly`}</div>
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
                placeholder="Type your question"
                className="min-w-0 flex-1 rounded-[999px] border border-paper/20 bg-transparent px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-paper/40 focus:border-amber"
              />
              <button
                type="submit"
                disabled={busy || !text.trim()}
                className="rounded-[999px] bg-paper px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-amber disabled:opacity-40"
              >
                Send
              </button>
            </form>
          </div>
        </section>
      )}
    </>
  )
}
