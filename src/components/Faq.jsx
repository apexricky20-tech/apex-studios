import { COST_ANSWER } from '../data/pricing'
import { askNey } from '../lib/ney'

// Keep in sync with the faqs list in scripts/seo.mjs (it writes the FAQ structured data).
const faqs = [
  ['What does it cost?', COST_ANSWER],
  ['How long does it take?', 'Most projects are delivered in 48 hours or less, and 72 hours at most, once you send your content and feedback quickly. You get the exact timeline with your quote.'],
  ['Can the website be updated without a developer?', 'Yes. You get a simple dashboard for posting updates, no developer needed.'],
  ['Will it work on phones?', 'Every site is built mobile-first and tested on real devices.'],
  ['Do you work with businesses outside Kenya?', 'Yes. We work remotely and the process is the same wherever you are.'],
]

export default function Faq() {
  return (
    <section aria-labelledby="faq-title" className="mx-auto max-w-4xl px-gutter py-24  md:py-32">
      <p className="text-sm uppercase tracking-widest text-amber">Before you ask</p>
      <h2 id="faq-title" className="mt-4 text-4xl md:text-6xl">
        The short answers
      </h2>
      <div className="mt-12 divide-y divide-paper/10 border-y border-paper/10">
        {faqs.map(([q, a], i) => (
          // name="faq": opening one closes the others, natively, so the list never grows into a wall of text.
          <details key={q} name="faq" className="faq py-6">
            <summary className="faq-q flex cursor-pointer list-none items-center gap-5 text-xl font-semibold marker:content-none">
              <span aria-hidden="true" className="w-6 font-mono text-xs font-medium tracking-widest text-muted">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="flex-1">{q}</span>
              <span aria-hidden="true" className="faq-icon" />
            </summary>
            <p className="mt-4 pl-11 text-paper/70">{a}</p>
            <button
              type="button"
              onClick={() => askNey(q)}
              className="mt-4 ml-11 text-sm font-semibold text-amber transition-colors hover:text-paper"
            >
              Ask Ney about this &rarr;
            </button>
          </details>
        ))}
      </div>
    </section>
  )
}
