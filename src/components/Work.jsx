const stats = [
  ['192', 'Google interactions across both branches'],
  ['100', 'Mobile performance score'],
  ['100', 'Mobile SEO score'],
]

export default function Work() {
  return (
    <section id="work" className="mx-auto max-w-7xl px-6 py-24 md:px-12 md:py-32">
      <p className="text-sm uppercase tracking-widest text-amber">01 / Selected work</p>
      <h2 className="mt-4 text-5xl md:text-7xl">Bullhead Hotel &amp; Butchery</h2>
      <p className="mt-6 max-w-2xl text-lg text-paper/70">
        A 24-hour hotel and butchery on the Mombasa highway, loved by weekend visitors but
        invisible online. We built a mobile-first site for both branches with delivery
        ordering, so customers who could only visit on weekends can now order during the week.
      </p>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {stats.map(([n, label]) => (
          <div key={label} className="rounded-2xl border border-paper/10 p-8">
            <p className="font-display text-6xl font-extrabold text-amber">{n}</p>
            <p className="mt-3 text-paper/70">{label}</p>
          </div>
        ))}
      </div>
      <a
        href="https://bullheadhotels.co.ke"
        target="_blank"
        rel="noreferrer"
        className="mt-10 inline-block font-semibold text-amber"
      >
        Visit the live site →
      </a>
    </section>
  )
}
