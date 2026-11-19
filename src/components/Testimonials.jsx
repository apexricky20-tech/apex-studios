import { Link } from 'react-router-dom'
import { testimonials } from '../data/testimonials'
import { Attribution } from './ClientQuote'

// Decorative, and themed to match the "transmission" labels: five bars that lock in as a quote scrolls
// into view, and one carrier wave drawn between the lead voice and the rest. CSS only (see index.css).
const WAVE = (() => {
  const pts = []
  for (let x = 0; x <= 600; x += 3) {
    const env = Math.sin((Math.PI * x) / 600) ** 2
    pts.push(`${x ? 'L' : 'M'}${x} ${(20 + Math.sin(x / 6) * 15 * env * (0.6 + 0.4 * Math.sin(x / 37))).toFixed(1)}`)
  }
  return pts.join('')
})()

const Signal = () => (
  <span className="signal" aria-hidden="true">
    {[0, 1, 2, 3, 4].map((i) => (
      <i key={i} style={{ '--i': i }} />
    ))}
  </span>
)

// Home page: one big voice, then the rest as "transmissions" from real clients.
export default function Testimonials() {
  const lead = testimonials.find((t) => t.featured) || testimonials[0]
  const rest = testimonials.filter((t) => t !== lead)
  const label = (t, i) => `Transmission ${String(i + 1).padStart(2, '0')} · ${t.place}`

  return (
    <section aria-labelledby="voices-title" className="mx-auto max-w-[1220px] px-gutter py-24 md:py-40">
      <p className="text-sm font-medium uppercase tracking-widest text-amber">Signal from the field</p>
      <h2 id="voices-title" className="mt-4 max-w-3xl text-4xl md:text-7xl">
        In their words
      </h2>

      <figure className="mt-14 md:mt-20">
        <p className="flex items-center gap-3 font-mono text-xs uppercase tracking-widest text-muted">
          <Signal />
          {label(lead, 0)}
        </p>
        <blockquote className="mt-6">
          <p className="max-w-4xl text-2xl leading-snug md:text-5xl md:leading-[1.15]">
            <span className="text-amber" aria-hidden="true">&ldquo;</span>
            {lead.lead || lead.full}
            <span className="text-amber" aria-hidden="true">&rdquo;</span>
          </p>
        </blockquote>
        <Attribution t={lead} />
        <Link
          to={`/work/${lead.slug}`}
          className="mt-6 inline-block border-b border-paper pb-0.5 text-sm font-semibold transition-colors hover:border-amber hover:text-amber"
        >
          Read the Bullhead case study &rsaquo;
        </Link>
      </figure>

      <svg className="wave mt-16 md:mt-24" viewBox="0 0 600 40" preserveAspectRatio="none" aria-hidden="true">
        <path d={WAVE} />
      </svg>

      <div className="mt-10 grid gap-4 md:mt-14 md:grid-cols-3">
        {rest.map((t, i) => (
          <figure
            key={t.id}
            data-tilt
            className="relative flex flex-col rounded-2xl border border-paper/15 bg-surface p-6 md:p-8"
          >
            <p className="flex items-center gap-3 font-mono text-xs uppercase tracking-widest text-muted">
              <Signal />
              {label(t, i + 1)}
            </p>
            <blockquote className="mt-5 flex-1">
              <p className="text-lg leading-relaxed text-paper/90">&ldquo;{t.full}&rdquo;</p>
            </blockquote>
            <Attribution t={t} />
          </figure>
        ))}
      </div>
    </section>
  )
}
