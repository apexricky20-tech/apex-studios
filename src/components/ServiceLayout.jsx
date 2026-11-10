import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Breadcrumbs from './Breadcrumbs'
import { serviceNames } from '../lib/crumbs'

export default function ServiceLayout({ page }) {
  const { sections } = page
  const { pathname } = useLocation()
  const [active, setActive] = useState(sections[0].id)

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: '-30% 0px -60% 0px' },
    )
    sections.forEach((s) => {
      const el = document.getElementById(s.id)
      if (el) io.observe(el)
    })
    return () => io.disconnect()
  }, [sections])

  const faq = sections.find((s) => s.faq)
  const faqLd = faq && {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.blocks.map((b) => ({
      '@type': 'Question',
      name: b.h,
      acceptedAnswer: { '@type': 'Answer', text: b.p },
    })),
  }

  return (
    <div className="px-gutter pb-32 pt-40 md:pt-48">
      <title>{page.title}</title>
      <meta name="description" content={page.description} />
      {faqLd && <script type="application/ld+json">{JSON.stringify(faqLd)}</script>}

      <div className="mx-auto max-w-[1240px]">
        <Breadcrumbs items={[{ name: 'Services', to: '/services' }, { name: serviceNames[pathname] || page.h1 }]} />
        <h1 className="mt-8 text-[clamp(3rem,7vw,6.5rem)] font-medium">{page.h1}</h1>
        <p className="mt-10 max-w-3xl text-xl leading-relaxed text-muted md:text-2xl">
          {page.intro}
        </p>

        <div className="mt-28 grid gap-16 lg:grid-cols-[260px_1fr] lg:gap-24">
          <aside className="hidden lg:block">
            <div className="sticky top-32">
              <p className="text-xs uppercase tracking-widest text-muted">On this page</p>
              <ul className="mt-8 border-l border-paper/15">
                {sections.map((s, i) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className={`-ml-px flex gap-4 border-l py-2 pl-5 text-sm transition-colors ${
                        active === s.id
                          ? 'border-paper text-paper'
                          : 'border-transparent text-muted hover:text-paper'
                      }`}
                    >
                      <span className="w-5 shrink-0 text-xs opacity-70">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      {s.nav}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          <div className="max-w-3xl space-y-28">
            {sections.map((s, i) => (
              <section key={s.id} id={s.id} className="scroll-mt-32">
                <p className="text-sm text-amber">{String(i + 1).padStart(2, '0')}</p>
                <h2 className="mt-3 text-4xl md:text-6xl">{s.title}</h2>
                <p className="mt-6 text-lg leading-relaxed text-muted md:text-xl">{s.intro}</p>

                {s.blocks.length > 0 && (
                  <div className="mt-12 space-y-10">
                    {s.blocks.map((b) => (
                      <div key={b.h}>
                        <h3 className="text-2xl md:text-3xl">{b.h}</h3>
                        <p className="mt-3 text-lg leading-relaxed text-muted">{b.p}</p>
                        {b.link && (
                          <Link
                            to={b.link.to}
                            className="mt-4 inline-block border-b border-paper pb-0.5 text-sm font-semibold transition-colors hover:border-amber hover:text-amber"
                          >
                            {b.link.label} &rsaquo;
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {s.cta && (
                  <Link
                    to={s.cta.to}
                    className="mt-10 inline-block rounded-full bg-amber px-8 py-4 font-semibold text-ink"
                  >
                    {s.cta.label}
                  </Link>
                )}
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
