const items = [
  ['Websites that feel like the place', 'Design and motion built around your atmosphere, not a template.'],
  ['Built for phones', 'Most guests find you on mobile, so every page is designed there first.'],
  ['Found on Google', 'Maps listings, local search, and page-by-page SEO from day one.'],
  ['Orders and enquiries', 'Delivery, bookings, and WhatsApp built into the site.'],
]

export default function Services() {
  return (
    <section id="services" className="mx-auto max-w-7xl px-6 py-24 md:px-12 md:py-32">
      <p className="text-sm uppercase tracking-widest text-amber">02 / What we build</p>
      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {items.map(([title, text]) => (
          <div key={title} className="rounded-2xl border border-paper/10 p-8">
            <h3 className="text-3xl">{title}</h3>
            <p className="mt-4 text-paper/70">{text}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
