import Marquee from './Marquee'

const steps = [
  ['01', 'Discovery call', 'We learn your place, your guests, and what a booking is worth to you.'],
  ['02', 'Plan and design', 'Structure, copy, and a design drawn around your brand.'],
  ['03', 'Build and test', 'Fast, responsive, checked on real phones before launch.'],
  ['04', 'Launch and handover', 'Domain, forms, analytics, and a walkthrough so you can update it yourself.'],
]

export default function Process({ asPage = false }) {
  const Heading = asPage ? 'h1' : 'h2'
  const Title = asPage ? 'h2' : 'h3'
  return (
    <>
    <Marquee />
    <section id="process" className="mx-auto max-w-[2000px] px-gutter py-24  md:py-32">
      <Heading className="sr-only">{asPage ? 'Our process' : 'How a build runs'}</Heading>
      <p className="text-sm uppercase tracking-widest text-amber">How a build runs</p>
      <div className="mt-12 grid gap-6 md:grid-cols-4">
        {steps.map(([n, title, text]) => (
          <div key={n}>
            <p className="font-display text-5xl font-extrabold text-amber">{n}</p>
            <Title className="mt-4 text-2xl">{title}</Title>
            <p className="mt-3 text-paper/70">{text}</p>
          </div>
        ))}
      </div>
    </section>
    </>
  )
}
