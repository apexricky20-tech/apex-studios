import { Link } from 'react-router-dom'
import { useContact } from '../lib/content'

const cols = { 3: 'md:grid-cols-3', 4: 'md:grid-cols-4' }

export default function ServicePage({ page }) {
  const contact = useContact()
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: page.faq.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }

  return (
    <main className="px-gutter pb-32 pt-40 md:pt-48">
      <title>{page.title}</title>
      <meta name="description" content={page.description} />
      <script type="application/ld+json">{JSON.stringify(faqLd)}</script>

      <div className="mx-auto max-w-[1220px]">
        <p className="text-sm uppercase tracking-widest text-muted">{page.label}</p>
        <h1 className="mt-8 text-[clamp(3rem,7vw,6.5rem)] font-medium">{page.h1}</h1>
        <p className="mt-10 max-w-3xl text-xl leading-relaxed text-muted md:text-2xl">
          {page.intro}
        </p>

        {page.visual && (
          <figure className="mt-16">
            <img
              src={page.visual.src}
              alt={page.visual.alt}
              className="w-full rounded-2xl border border-paper/10"
            />
            <figcaption className="mt-4 text-xs text-muted">{page.visual.caption}</figcaption>
          </figure>
        )}

        {page.sections.map((s) => (
          <section key={s.title} className="mt-32 md:mt-40">
            <h2 className="text-5xl md:text-7xl">{s.title}</h2>
            <p className="mt-5 text-sm text-muted">{s.sub}</p>

            {s.type === 'steps' ? (
              <div className={`mt-16 grid gap-12 ${cols[s.items.length] || 'md:grid-cols-3'}`}>
                {s.items.map((it, i) => (
                  <div key={it.h}>
                    <span className="grid h-11 w-11 place-items-center rounded-full border border-paper/10 bg-surface text-xs font-semibold">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <h3 className="mt-8 text-2xl">{it.h}</h3>
                    <p className="mt-4 leading-relaxed text-muted">{it.p}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-16 grid gap-x-16 gap-y-14 md:grid-cols-2">
                {s.items.map((it) => (
                  <div key={it.h}>
                    <h3 className="text-2xl">{it.h}</h3>
                    <p className="mt-4 text-lg leading-relaxed text-muted">{it.p}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}

        <section className="mt-32 md:mt-40">
          <h2 className="text-5xl md:text-7xl">Before you ask</h2>
          <div className="mt-14 max-w-[880px] space-y-3">
            {page.faq.map((f) => (
              <details
                key={f.q}
                className="group rounded-xl border border-paper/10 bg-surface"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 p-6 text-lg font-medium md:text-xl [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5 shrink-0 text-muted transition-transform duration-300 group-open:rotate-180"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    aria-hidden="true"
                  >
                    <path d="M4 8l8 8 8-8" />
                  </svg>
                </summary>
                <p className="px-6 pb-6 text-lg leading-relaxed text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-32 border-t border-paper/15 pt-24 md:mt-40">
        <div className="mx-auto max-w-[1220px]">
          <h2 className="text-5xl md:text-7xl">{page.cta.title}</h2>
          <p className="mt-6 max-w-xl text-xl leading-relaxed text-muted">{page.cta.text}</p>
          {contact.email ? (
            <a
              href={`mailto:${contact.email}`}
              className="mt-10 inline-block rounded-full border border-paper/25 px-8 py-4 text-lg font-medium transition-colors hover:border-amber hover:text-amber"
            >
              {contact.email}
            </a>
          ) : (
            <Link
              to="/contact"
              className="mt-10 inline-block rounded-full border border-paper/25 px-8 py-4 text-lg font-medium transition-colors hover:border-amber hover:text-amber"
            >
              Start a project
            </Link>
          )}
        </div>
      </div>
    </main>
  )
}
