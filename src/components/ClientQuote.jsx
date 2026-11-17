// Small building blocks for client reviews, shared by the home page, case studies and service pages.
export function Rating({ t }) {
  if (t.stars) {
    return (
      <span className="inline-flex items-center gap-1 text-amber" role="img" aria-label={`${t.stars} out of 5 stars`}>
        {Array.from({ length: t.stars }, (_, i) => (
          <svg key={i} viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden="true">
            <polygon points="10,1.5 12.6,7.1 18.7,7.8 14.2,12 15.4,18 10,14.9 4.6,18 5.8,12 1.3,7.8 7.4,7.1" />
          </svg>
        ))}
      </span>
    )
  }
  if (t.score) {
    return (
      <span className="rounded-full border border-amber/40 px-3 py-1 text-xs font-semibold text-amber">
        {t.score} <span className="sr-only">rating given by the client</span>
      </span>
    )
  }
  return null
}

export function Attribution({ t }) {
  return (
    <figcaption className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
      <span>
        <span className="block font-semibold">{t.name}</span>
        <span className="block text-sm text-muted">
          {t.role}, {t.business}
        </span>
      </span>
      <Rating t={t} />
    </figcaption>
  )
}

// A compact pull quote: amber rule on the left. `text` picks the short pull or the full review.
export default function ClientQuote({ t, text = 'short', className = '' }) {
  return (
    <figure className={`border-l-2 border-amber pl-5 md:pl-6 ${className}`}>
      <blockquote>
        <p className="text-lg leading-relaxed text-paper/90 md:text-xl">&ldquo;{t[text]}&rdquo;</p>
      </blockquote>
      <Attribution t={t} />
    </figure>
  )
}
