import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useContact } from '../lib/content'
import { waHref } from '../lib/whatsapp'

// The free digital check, live: type a website address, Google's PageSpeed Insights tests it on a simulated
// phone (10 to 30 seconds), and the visitor gets three scores, three timings and the three things costing
// them the most, then one tap to send it to us on WhatsApp. Nothing is stored by us.

const STAGES = [
  'Opening your site on a mid-range phone',
  'Timing how fast it appears',
  'Checking what Google can read',
  'Looking for things that block guests',
]

const tone = (n) => (n >= 90 ? '#12b76a' : n >= 50 ? '#ff8200' : '#f04438')
const verdict = (n) => (n >= 90 ? 'Good' : n >= 50 ? 'Needs work' : 'Poor')

function Ring({ label, value }) {
  const r = 34
  const c = 2 * Math.PI * r
  const shown = value ?? 0
  return (
    <div className="text-center">
      <div className="relative mx-auto h-24 w-24">
        <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90" aria-hidden="true">
          <circle cx="40" cy="40" r={r} fill="none" stroke="rgb(255 255 255 / 0.12)" strokeWidth="6" />
          <circle
            cx="40"
            cy="40"
            r={r}
            fill="none"
            stroke={tone(shown)}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={c}
            className="site-ring"
            style={{ '--c': c, '--to': c * (1 - shown / 100) }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-display text-3xl font-bold" style={{ color: tone(shown) }}>
          {value ?? '-'}
        </span>
      </div>
      <p className="mt-3 text-sm font-medium">{label}</p>
      <p className="text-xs text-muted">{value == null ? 'Not available' : verdict(shown)}</p>
    </div>
  )
}

export default function SiteCheck({ id = 'free-check', heading = 'h2', title = 'Is your website costing you bookings?', intro }) {
  const Heading = heading
  const { whatsapp } = useContact()
  const [params] = useSearchParams()
  const [url, setUrl] = useState(params.get('url') || '')
  const [state, setState] = useState('idle') // idle | working | done | error
  const [stage, setStage] = useState(0)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const abort = useRef(null)

  useEffect(() => {
    if (state !== 'working') return undefined
    const t = setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), 6000)
    return () => clearInterval(t)
  }, [state])
  useEffect(() => () => abort.current?.abort(), [])

  const run = async (e) => {
    e.preventDefault()
    if (state === 'working') return
    setState('working')
    setStage(0)
    setError('')
    abort.current?.abort()
    abort.current = new AbortController()
    try {
      const res = await fetch('/api/pagespeed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
        signal: abort.current.signal,
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.')
      setResult(data)
      setState('done')
    } catch (err) {
      if (err.name === 'AbortError') return
      setError(err.message || 'Something went wrong. Please try again.')
      setState('error')
    }
  }

  const host = result?.url ? result.url.replace(/^https?:\/\//, '').replace(/\/$/, '') : ''
  const message = result
    ? `Hi Apex Studios, I ran the free check on ${host}. Speed ${result.scores.performance ?? '-'}/100, Search ${result.scores.seo ?? '-'}/100, Accessibility ${result.scores.accessibility ?? '-'}/100. I'd like you to look at it and tell me what to fix first.`
    : ''
  const wa = waHref(whatsapp, message)

  return (
    <section id={id} aria-labelledby={`${id}-title`} className="mx-auto max-w-[1220px] px-gutter py-20 md:py-28">
      <p className="text-sm uppercase tracking-widest text-amber">Free digital check</p>
      <Heading id={`${id}-title`} className="mt-4 max-w-3xl text-3xl md:text-5xl">
        {title}
      </Heading>
      <p className="mt-6 max-w-2xl text-lg text-muted">
        {intro || 'Paste your website address. We test it on a simulated phone, the way a guest on mobile data sees it, and show you what is slowing it down or hiding it from Google.'}
      </p>

      <form onSubmit={run} className="mt-10 flex max-w-2xl flex-col gap-3 sm:flex-row" noValidate>
        <label htmlFor={`${id}-url`} className="sr-only">
          Your website address
        </label>
        <input
          id={`${id}-url`}
          type="text"
          inputMode="url"
          autoComplete="url"
          autoCapitalize="none"
          spellCheck="false"
          placeholder="yourlodge.co.ke"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={state === 'working'}
          className="min-w-0 flex-1 rounded-full border border-paper/25 bg-transparent px-6 py-4 text-base text-paper placeholder:text-paper/40 focus:border-amber focus:outline-none"
        />
        <button
          type="submit"
          disabled={state === 'working' || !url.trim()}
          className="rounded-full bg-paper px-8 py-4 text-sm font-semibold uppercase tracking-wider text-ink transition-colors hover:bg-amber disabled:opacity-50"
        >
          {state === 'working' ? 'Checking...' : 'Check my site'}
        </button>
      </form>

      <div aria-live="polite" className="mt-10">
        {state === 'working' && (
          <div className="max-w-2xl rounded-2xl border border-paper/15 bg-surface p-6">
            <div className="h-1 overflow-hidden rounded-full bg-paper/10">
              <div className="site-bar h-full rounded-full bg-amber" />
            </div>
            <p className="mt-5 font-medium">{STAGES[stage]}...</p>
            <p className="mt-1 text-sm text-muted">This usually takes 10 to 30 seconds. Please keep this page open.</p>
          </div>
        )}

        {state === 'error' && (
          <div className="max-w-2xl rounded-2xl border border-paper/15 bg-surface p-6">
            <p className="font-medium">{error}</p>
            <div className="mt-5 flex flex-wrap gap-4 text-sm">
              {waHref(whatsapp, `Hi Apex Studios, could you run the free digital check on ${url || 'my website'}?`) && (
                <a
                  href={waHref(whatsapp, `Hi Apex Studios, could you run the free digital check on ${url || 'my website'}?`)}
                  target="_blank"
                  rel="noreferrer"
                  className="border-b border-paper pb-0.5 font-semibold transition-colors hover:border-amber hover:text-amber"
                >
                  Ask us to run it on WhatsApp &rsaquo;
                </a>
              )}
              <Link to="/contact?offer=free-check" className="border-b border-paper pb-0.5 font-semibold transition-colors hover:border-amber hover:text-amber">
                Send us the link instead &rsaquo;
              </Link>
            </div>
          </div>
        )}

        {state === 'done' && result && (
          <div className="rounded-3xl border border-paper/10 bg-surface p-6 md:p-10">
            <p className="text-sm text-muted">
              Result for <span className="text-paper">{host}</span>, tested on a simulated mobile phone
            </p>
            <div className="mt-8 grid grid-cols-3 gap-4">
              <Ring label="Speed" value={result.scores.performance} />
              <Ring label="Google search" value={result.scores.seo} />
              <Ring label="Accessibility" value={result.scores.accessibility} />
            </div>

            <dl className="mt-10 grid gap-4 border-t border-paper/10 pt-8 sm:grid-cols-3">
              {[
                ['Main content appears', result.metrics.lcp],
                ['Page frozen while loading', result.metrics.tbt],
                ['Layout jumping', result.metrics.cls],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs uppercase tracking-widest text-muted">{k}</dt>
                  <dd className="mt-1 text-xl">{v || 'n/a'}</dd>
                </div>
              ))}
            </dl>

            {result.issues.length > 0 ? (
              <div className="mt-10 border-t border-paper/10 pt-8">
                <h3 className="text-2xl md:text-3xl">What is costing you the most</h3>
                <ol className="mt-6 space-y-4">
                  {result.issues.map((i, n) => (
                    <li key={i.id} className="flex gap-4">
                      <span className="font-display text-2xl font-extrabold text-amber">{String(n + 1).padStart(2, '0')}</span>
                      <span>
                        <span className="block text-lg">{i.title}</span>
                        {i.detail && <span className="text-sm text-muted">{i.detail}</span>}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            ) : (
              <p className="mt-10 border-t border-paper/10 pt-8 text-lg">Nothing major is holding this site back. Well done.</p>
            )}

            <div className="mt-10 flex flex-wrap items-center gap-3">
              {wa && (
                <a
                  href={wa}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-paper px-8 py-4 text-sm font-semibold uppercase tracking-wider text-ink transition-colors hover:bg-amber"
                >
                  Send this to us on WhatsApp
                </a>
              )}
              <Link
                to="/contact?offer=free-check"
                className="rounded-full border border-paper/25 px-8 py-4 text-sm font-semibold uppercase tracking-wider transition-colors hover:border-amber hover:text-amber"
              >
                Get the written check
              </Link>
            </div>
            <p className="mt-6 text-xs text-muted">
              Measured by Google PageSpeed Insights. Scores move a little from one run to the next, so treat them as a guide. We do not store your result.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
