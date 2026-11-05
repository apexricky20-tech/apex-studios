import { useEffect, useRef, useState } from 'react'
import { useContact, useSite } from '../lib/content'

const services = [
  'Website Design',
  'Development',
  'Automation',
  'Branding',
  'Google Business Profile',
  'Not sure yet',
]

const before = [
  ['What to include', 'Your business name, a link to your current website or Google listing if you have one, what you want built, and when you need it live.'],
  ['What happens next', 'We read every message, reply with a few questions, and arrange a call if we are a good fit.'],
  ['Cost', 'A quote follows the first call, once we understand the scope. We do not price from a form.'],
]

const input =
  'w-full border-b border-paper/20 bg-transparent py-4 text-lg outline-none transition-colors placeholder:text-paper/30 focus:border-amber'
const label = 'block text-sm text-muted'
const row = 'grid gap-6 border-t border-paper/15 py-12 md:grid-cols-[450px_1fr] md:gap-0'
const small = 'text-xs uppercase tracking-widest text-muted'

function handleOf(url) {
  try {
    const last = new URL(url).pathname.split('/').filter(Boolean).pop()
    return last ? (last.startsWith('@') ? last : `@${last}`) : url
  } catch {
    return url
  }
}

const icons = {
  mail: 'M3 6h18v12H3zM3 7l9 7 9-7',
  chat: 'M4 5h16v11H9l-5 4z',
  insta: 'M4 4h16v16H4zM12 8a4 4 0 100 8 4 4 0 000-8zM17 7h.01',
  tiktok: 'M14 4v10.5a3.5 3.5 0 11-3.5-3.5M14 4c.5 2.5 2 4 4.5 4.2',
  pin: 'M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11zM12 7.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5z',
}

function Icon({ name }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d={icons[name]} />
    </svg>
  )
}

function Card({ icon, title, value, href }) {
  const body = (
    <>
      <Icon name={icon} />
      <span className="min-w-0 flex-1">
        <span className="block text-xs uppercase tracking-widest text-muted">{title}</span>
        <span className="mt-1 block truncate text-xl">{value}</span>
      </span>
      {href && <span aria-hidden="true" className="text-muted">&#8599;</span>}
    </>
  )
  const cls = 'flex items-center gap-4 rounded-2xl border border-paper/15 p-5'
  return href ? (
    <a
      href={href}
      target={href.startsWith('http') ? '_blank' : undefined}
      rel="noreferrer"
      className={`${cls} transition-colors hover:border-amber`}
    >
      {body}
    </a>
  ) : (
    <div className={cls}>{body}</div>
  )
}

export default function ContactPage() {
  const contact = useContact()
  const site = useSite()
  const [status, setStatus] = useState('idle') // idle | sending | sent | mailto | error
  const started = useRef(0)
  useEffect(() => {
    started.current = Date.now()
  }, [])

  const onSubmit = async (e) => {
    e.preventDefault()
    const form = e.currentTarget
    const d = Object.fromEntries(new FormData(form))
    if (d.website) {
      setStatus('sent') // honeypot filled: a bot. Pretend, send nothing.
      return
    }
    const payload = {
      name: d.name,
      email: d.email,
      company: d.company || '',
      service: d.service || '',
      message: d.message || '',
      page: window.location.pathname,
      elapsedMs: Date.now() - started.current,
      sentAt: new Date().toISOString(),
    }

    if (!contact.endpoint) {
      const body = [
        `Name: ${payload.name}`,
        `Email: ${payload.email}`,
        payload.company && `Company: ${payload.company}`,
        payload.service && `Need: ${payload.service}`,
        '',
        payload.message,
      ]
        .join('\n')
      window.location.href = `mailto:${contact.email}?subject=${encodeURIComponent(
        `New enquiry from ${payload.name}`,
      )}&body=${encodeURIComponent(body)}`
      setStatus('mailto')
      return
    }

    setStatus('sending')
    try {
      const res = await fetch(contact.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('bad status')
      form.reset()
      setStatus('sent')
    } catch {
      setStatus('error')
    }
  }

  const insta = contact.instagram && { title: 'Instagram', value: handleOf(contact.instagram), href: contact.instagram, icon: 'insta' }
  const tiktok = contact.tiktok && { title: 'TikTok', value: handleOf(contact.tiktok), href: contact.tiktok, icon: 'tiktok' }
  const cards = [
    contact.email && { title: 'Email', value: contact.email, href: `mailto:${contact.email}`, icon: 'mail' },
    contact.whatsapp && { title: 'WhatsApp', value: 'Message us', href: `https://wa.me/${contact.whatsapp}`, icon: 'chat' },
    insta,
    tiktok,
    { title: 'Studio', value: site.location, icon: 'pin' },
  ].filter(Boolean)

  return (
    <main className="px-gutter pb-32 pt-40 md:pt-48">
      <title>Contact Apex Studios | Start a Project in Kenya</title>
      <meta
        name="description"
        content="Tell Apex Studios about your hotel, lodge or restaurant. Share what you need and we will reply with the next step."
      />
      <div className="mx-auto max-w-[1220px]">
        <p className="text-sm uppercase tracking-widest text-muted">Contact</p>
        <h1 className="mt-8 max-w-4xl text-[clamp(3rem,7vw,6.5rem)] font-medium">
          Let&apos;s talk about your project
        </h1>
        <p className="mt-8 max-w-2xl text-lg text-muted md:text-xl">
          Tell us about your business and what you want built. The more you share, the more useful
          our first reply will be.
        </p>

        <h2 className="mt-32 text-[clamp(2.5rem,5vw,4.5rem)] font-medium md:mt-44">Send a message</h2>
        <p className="mt-4 text-muted">All fields are required except company.</p>

        <form onSubmit={onSubmit} className="mt-14">
          <div className="hidden" aria-hidden="true">
            <label>
              Leave this empty
              <input type="text" name="website" tabIndex={-1} autoComplete="off" />
            </label>
          </div>

          <div className={row}>
            <p className={small}>About you</p>
            <div className="max-w-[470px] space-y-10">
              <label className={label}>
                Name
                <input required name="name" autoComplete="name" className={input} />
              </label>
              <label className={label}>
                Email
                <input required type="email" name="email" autoComplete="email" className={input} />
              </label>
              <label className={label}>
                Company (optional)
                <input name="company" autoComplete="organization" className={input} />
              </label>
            </div>
          </div>

          <div className={row}>
            <p className={small}>About the project</p>
            <div className="max-w-[470px] space-y-10">
              <label className={label}>
                What you need
                <span className="relative block">
                  <select
                    required
                    name="service"
                    defaultValue=""
                    className={`${input} cursor-pointer appearance-none pr-8 [&>option]:bg-ink`}
                  >
                    <option value="" disabled>
                      Choose one
                    </option>
                    {services.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <svg viewBox="0 0 24 24" className="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </span>
              </label>
              <label className={label}>
                Your project
                <textarea required name="message" rows="6" className={`${input} resize-y`} />
              </label>
            </div>
          </div>

          <div className="grid gap-6 border-t border-paper/15 pt-12 md:grid-cols-[450px_1fr] md:gap-0">
            <span />
            <div>
              <button
                type="submit"
                disabled={status === 'sending'}
                className="rounded-full border border-paper/25 px-9 py-5 font-medium transition-colors hover:border-amber hover:text-amber disabled:opacity-50"
              >
                {status === 'sending' ? 'Sending...' : 'Send message'}
              </button>
              <div role="status" aria-live="polite" className="mt-6 max-w-md text-lg">
                {status === 'sent' && (
                  <p className="text-amber">Thank you. Your message has been sent and we will reply by email.</p>
                )}
                {status === 'mailto' && (
                  <p className="text-muted">
                    Your email app should have opened with the message ready to send. If it did not,
                    write to us at {contact.email}.
                  </p>
                )}
                {status === 'error' && (
                  <p className="text-muted">
                    Something went wrong and the message was not sent. Please try again
                    {contact.email ? `, or email us at ${contact.email}` : ''}.
                  </p>
                )}
              </div>
            </div>
          </div>
        </form>

        <h2 className="mt-32 text-[clamp(2.5rem,5vw,4.5rem)] font-medium md:mt-44">Or reach us directly</h2>
        <div className="mt-12 grid gap-3 sm:grid-cols-2">
          {cards.map((c) => (
            <Card key={c.title} {...c} />
          ))}
        </div>

        <h2 className="mt-32 text-[clamp(2.5rem,5vw,4.5rem)] font-medium md:mt-44">Before you write</h2>
        <div className="mt-14 border-b border-paper/15">
          {before.map(([title, text]) => (
            <div key={title} className={row}>
              <p className={small}>{title}</p>
              <p className="max-w-2xl text-2xl leading-snug">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
