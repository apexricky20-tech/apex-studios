import { Link } from 'react-router-dom'
import { testimonials } from '../data/testimonials'
import { Attribution } from './ClientQuote'

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
        <p className="font-mono text-xs uppercase tracking-widest text-muted">{label(lead, 0)}</p>
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

      <div className="mt-16 grid gap-4 md:mt-24 md:grid-cols-3">
        {rest.map((t, i) => (
          <figure
            key={t.id}
            data-tilt
            className="relative flex flex-col rounded-2xl border border-paper/15 bg-surface p-6 md:p-8"
          >
            <p className="font-mono text-xs uppercase tracking-widest text-muted">{label(t, i + 1)}</p>
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
