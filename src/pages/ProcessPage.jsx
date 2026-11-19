import { Link } from 'react-router-dom'
import Breadcrumbs from '../components/Breadcrumbs'
import Faq from '../components/Faq'
import Marquee from '../components/Marquee'

const steps = [
  {
    n: '01',
    title: 'Discovery call',
    happens: 'We talk about your place, your guests and how bookings or orders reach you today. We look at what is working and what is losing you business.',
    need: 'A rough idea of what you offer, your current website or Google listing if you have one, and when you would like to be live.',
    get: 'A clear scope and a quote, so you know what you are paying for before we start.',
  },
  {
    n: '02',
    title: 'Plan and design',
    happens: 'We map out the pages, tidy or write the copy, and design the site around your brand and the way your guests book.',
    need: 'Your logo and colours if you have them, photos (phone photos are fine to start), prices, and your room or menu details.',
    get: 'A design you approve before anything is built.',
  },
  {
    n: '03',
    title: 'Build and test',
    happens: 'We build the site mobile-first, add your booking or enquiry flow, and check it on real phones and browsers.',
    need: 'Quick answers to our questions and your feedback on the preview. The faster this goes, the faster you launch.',
    get: 'A working preview you can open on your own phone and review.',
  },
  {
    n: '04',
    title: 'Launch and handover',
    happens: 'We connect your domain, switch on forms and analytics, and walk you through updating the site yourself.',
    need: 'Access to your domain, or a decision on the name if you need a new one.',
    get: 'A live site, a walkthrough, and a point of contact if something needs fixing.',
  },
]

const ready = [
  'Your logo and brand colours, if you have them',
  'Photos of your rooms, food, building and team',
  'Room types and prices, or your menu',
  'Your phone number, WhatsApp number and address',
  'A link to your Google listing and social pages',
  'Two or three websites you like, and why',
]

export default function ProcessPage() {
  return (
    <div className="pt-20">
      <title>Our Process: From First Call to Launch | Apex Studios</title>
      <meta name="description" content="How Apex Studios takes a hotel, lodge or restaurant website from the first call to launch and handover, in four clear steps." />

      <div className="px-gutter pt-20 md:pt-28">
        <div className="mx-auto max-w-[1400px]">
          <Breadcrumbs items={[{ name: 'Our Process' }]} />
          <header className="mt-10 max-w-4xl">
            <p className="text-sm font-medium uppercase tracking-widest text-amber">How a build runs</p>
            <h1 className="mt-6 text-5xl font-bold leading-[1.04] md:text-8xl">
              From first call to launch, in <span className="text-amber">four clear steps</span>
            </h1>
            <p className="mt-8 max-w-2xl text-lg text-muted md:text-xl">
              No surprises and no jargon. Here is what happens at each stage, what we will need from you, and what you
              get at the end of it.
            </p>
          </header>
        </div>
      </div>

      <div className="mt-20 md:mt-28">
        <Marquee />
      </div>

      <section aria-labelledby="steps-title" className="px-gutter py-24 md:py-32">
        <h2 id="steps-title" className="sr-only">
          The four steps
        </h2>
        <ol className="mx-auto max-w-[1400px] divide-y divide-paper/10 border-y border-paper/10">
          {steps.map((s) => (
            <li key={s.n} className="grid gap-8 py-12 md:grid-cols-[260px_1fr] md:gap-12 md:py-16">
              <div>
                <p className="font-display text-6xl font-extrabold text-amber md:text-7xl">{s.n}</p>
                <h3 className="mt-4 text-3xl font-semibold">{s.title}</h3>
              </div>
              <dl className="grid gap-8 md:grid-cols-3">
                {[
                  ['What happens', s.happens],
                  ['What we need from you', s.need],
                  ['What you get', s.get],
                ].map(([label, text]) => (
                  <div key={label}>
                    <dt className="text-xs font-medium uppercase tracking-widest text-muted">{label}</dt>
                    <dd className="mt-3 text-paper/80">{text}</dd>
                  </div>
                ))}
              </dl>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="ready-title" className="px-gutter pb-24 md:pb-32">
        <div className="mx-auto grid max-w-[1400px] gap-10 rounded-3xl border border-paper/10 bg-surface p-8 md:grid-cols-2 md:gap-16 md:p-14">
          <div>
            <h2 id="ready-title" className="text-3xl font-bold md:text-5xl">
              Have these ready and it goes faster
            </h2>
            <p className="mt-5 text-muted">
              Do not worry if you do not have everything. Tell us what is missing on the first call and we will help you
              sort it.
            </p>
          </div>
          <ul className="space-y-4 text-lg text-paper/80">
            {ready.map((item) => (
              <li key={item} className="flex gap-3">
                <span aria-hidden="true" className="mt-2.5 h-2 w-2 flex-none rounded-full bg-amber" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="after-title" className="px-gutter pb-8">
        <div className="mx-auto max-w-[1400px]">
          <h2 id="after-title" className="text-3xl font-bold md:text-5xl">
            And after launch?
          </h2>
          <p className="mt-5 max-w-2xl text-lg text-muted">
            A website needs looking after. Our <Link to="/care-plans" className="text-amber hover:underline">care plans</Link>{' '}
            cover updates, backups and fixes, so the site stays fast, secure and current.
          </p>
        </div>
      </section>

      <Faq />

      <section aria-labelledby="start-title" className="px-gutter pb-32 text-center">
        <h2 id="start-title" className="text-4xl font-bold md:text-7xl">
          Ready to start?
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-lg text-muted">
          Tell us about your hotel, lodge or restaurant. We will reply with the next step.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/contact"
            className="inline-block rounded-full bg-paper px-9 py-4 text-sm font-semibold text-ink transition-colors hover:bg-amber"
          >
            Start a project
          </Link>
          <Link
            to="/"
            className="inline-block rounded-full border border-paper/25 px-9 py-4 text-sm font-semibold transition-colors hover:border-amber hover:text-amber"
          >
            ← Back to home
          </Link>
        </div>
      </section>
    </div>
  )
}
