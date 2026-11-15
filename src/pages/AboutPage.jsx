import { Link } from 'react-router-dom'
import Marquee from '../components/Marquee'
import { useSite } from '../lib/content'

const stats = [
  ['3', 'Projects in our portfolio'],
  ['100', 'Bullhead mobile performance score (PageSpeed Insights, Nov 2026)'],
  ['5', 'Services, one studio'],
]

const values = [
  ['Clarity', 'Plain words, simple pages and clear next steps, so a visitor always knows what to do next.'],
  ['Speed', 'Pages that load quickly on the phones and connections people actually use, checked before launch.'],
  ['Honesty', 'We say plainly what will and will not work, and we never promise a ranking or a result nobody can control.'],
  ['Care', 'Real photos, accurate details and attention to small things, because small things are what guests notice.'],
  ['Planning', 'Pages, content and timing are agreed before design starts, so surprises stay rare.'],
]

const mask = 'radial-gradient(ellipse at center, black 50%, transparent 100%)'

export default function AboutPage() {
  const site = useSite()
  return (
    <div>
      <title>About Apex Studios | Nairobi Web Design Studio</title>
      <meta
        name="description"
        content="Apex Studios is a Nairobi studio that designs and builds websites, Google Business Profiles and brands for hotels, lodges and restaurants across Kenya."
      />

      <section className="px-gutter pb-24 pt-40 text-center md:pb-32 md:pt-56">
        <p className="text-sm font-medium uppercase tracking-widest text-amber">About</p>
        <h1 className="mx-auto mt-8 max-w-6xl text-[clamp(3rem,9vw,8rem)] font-bold">
          Great Places Deserve to Be <span className="text-amber">Found</span>
        </h1>
        <p className="mx-auto mt-10 max-w-2xl text-lg text-muted md:text-xl">
          Apex Studios is a Nairobi studio that designs and builds websites, Google Business
          Profiles and brands for hotels, lodges and restaurants across Kenya.
        </p>
      </section>

      <Marquee />

      <section className="mx-auto max-w-[1240px] px-gutter py-32 md:py-44">
        <h2 className="text-[clamp(2.5rem,6vw,5.5rem)] font-bold">
          Simple to <span className="text-amber">Find</span>.
          <br />
          Easy to <span className="text-amber">Trust</span>.
        </h2>
        <p className="mt-10 max-w-2xl text-lg text-muted md:text-xl">
          Guests decide quickly, usually on a phone. We build the pages, listings and brands that
          help them find a place, trust it and get in touch.{' '}
          <strong className="font-medium text-paper">That is the whole job.</strong>
        </p>
      </section>

      <section className="mx-auto grid max-w-[1240px] items-center gap-16 px-gutter pb-32 md:pb-44 lg:grid-cols-2 lg:gap-24">
        <div>
          <h2 className="text-[clamp(2.5rem,5vw,4.5rem)] font-bold">
            From <span className="text-amber">First Call</span> to a Live Site
          </h2>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted">
            Every project begins with a conversation about your business and the guests you want to
            reach. We plan the pages, design them, build the site and test it on real phones, then
            hand it over with a walkthrough so you can keep it up to date.
          </p>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
            We work with businesses across Kenya, remotely, over calls and WhatsApp. Our portfolio
            includes Bullhead Hotel &amp; Butchery in Emali and Google Business Profiles for two
            guest houses in Rombo.
          </p>
          <ul className="mt-14 grid max-w-xl grid-cols-3 gap-8">
            {stats.map(([n, label]) => (
              <li key={n}>
                <p className="text-5xl font-bold tracking-tight md:text-6xl">{n}</p>
                <p className="mt-3 text-sm text-muted">{label}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="lg:order-first">
          <img
            src={site.portrait}
            alt={`Portrait of ${site.name}, founder of Apex Studios`}
            loading="lazy"
            className="mx-auto max-h-[640px] w-auto max-w-full"
            style={{ maskImage: mask, WebkitMaskImage: mask }}
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-gutter pb-32 md:pb-44">
        <h2 className="text-center text-[clamp(2.5rem,6vw,5rem)] font-bold">What Drives Us</h2>
        <ul className="mt-20 border-b border-paper/15">
          {values.map(([title, text], i) => (
            <li
              key={title}
              className="group grid gap-3 border-t border-paper/15 py-8 md:grid-cols-[4.5rem_13rem_1fr] md:gap-6"
            >
              <span className="text-sm font-medium text-amber">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="text-3xl transition-colors group-hover:text-amber">{title}</h3>
              <p className="text-muted">{text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="px-gutter pb-40 text-center md:pb-56">
        <h2 className="mx-auto max-w-4xl text-[clamp(2.5rem,7vw,6rem)] font-bold">
          Let&apos;s talk about your place
        </h2>
        <p className="mx-auto mt-8 max-w-xl text-lg text-muted">
          Tell us about your business and what you want the website to do. We will reply with the
          next step.
        </p>
        <Link
          to="/contact"
          className="mt-10 inline-block rounded-full bg-paper px-9 py-4 text-sm font-semibold text-ink transition-colors hover:bg-amber"
        >
          Get Started
        </Link>
      </section>
    </div>
  )
}
