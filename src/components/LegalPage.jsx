// Shared layout for the Privacy and Terms pages.
export default function LegalPage({ title, updated, intro, sections }) {
  return (
    <main className="px-gutter pb-32 pt-40 md:pt-48">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm uppercase tracking-widest text-muted">Legal</p>
        <h1 className="mt-8 text-[clamp(2.75rem,6vw,5.5rem)] font-medium">{title}</h1>
        <p className="mt-6 text-sm text-muted">Last updated {updated}</p>
        {intro && <p className="mt-8 text-lg text-paper/80">{intro}</p>}
        <div className="mt-14 space-y-12">
          {sections.map(([heading, body]) => (
            <section key={heading}>
              <h2 className="text-2xl font-medium tracking-tight md:text-3xl">{heading}</h2>
              <div className="mt-4 space-y-4 text-paper/75">{body}</div>
            </section>
          ))}
        </div>
      </div>
    </main>
  )
}
