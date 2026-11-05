const faqs = [
  ['What does it cost?', 'Every project is quoted after a first call, once the scope is clear. Nothing is priced from a form.'],
  ['How long does it take?', 'It depends on the size of the site. You get a timeline with your quote.'],
  ['Can the website be updated without a developer?', 'Yes. You get a simple dashboard for posting updates, no developer needed.'],
  ['Will it work on phones?', 'Every site is built mobile-first and tested on real devices.'],
  ['Do you work with businesses outside Kenya?', 'Yes. We work remotely and the process is the same wherever you are.'],
]

export default function Faq() {
  return (
    <section className="mx-auto max-w-4xl px-gutter py-24  md:py-32">
      <p className="text-sm uppercase tracking-widest text-amber">Before you ask</p>
      <div className="mt-12 divide-y divide-paper/10 border-y border-paper/10">
        {faqs.map(([q, a]) => (
          <details key={q} className="group py-6">
            <summary className="cursor-pointer list-none text-xl font-semibold marker:content-none">
              {q}
            </summary>
            <p className="mt-4 text-paper/70">{a}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
