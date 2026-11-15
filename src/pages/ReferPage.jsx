import { Link } from 'react-router-dom'
import Breadcrumbs from '../components/Breadcrumbs'
import { useContact } from '../lib/content'
import { referral } from '../data/referral'

const steps = [
  ['Introduce us', 'Tell us about a hotel, lodge or restaurant that needs a website or better online bookings. Let them know you are doing it.'],
  ['We take it from there', 'We speak to them, listen to what they need and send a clear quote. You do not have to manage anything.'],
  ['You get rewarded', `If they become a paying client, you receive ${referral.reward}, ${referral.paidWhen}.`],
]

const button =
  'inline-block rounded-full px-8 py-4 text-sm font-semibold transition-colors'

export default function ReferPage() {
  const { whatsapp } = useContact()
  const origin = typeof window === 'undefined' ? 'https://your-site' : window.location.origin
  const digits = (whatsapp || '').replace(/\D/g, '')
  const wa = digits
    ? `https://wa.me/${digits}?text=${encodeURIComponent(
        "Hi, I'd like to refer a business to Apex Studios.\nBusiness name:\nContact person and number:\nWhat they need:",
      )}`
    : null

  return (
    <div className="px-gutter pb-32 pt-40 md:pt-48">
      <title>Refer a Client | Apex Studios</title>
      <meta
        name="description"
        content="Know a hotel, lodge or restaurant that needs a better website? Introduce them to Apex Studios and earn a reward when they become a client."
      />
      <div className="mx-auto max-w-5xl">
        <Breadcrumbs items={[{ name: 'Refer a Client' }]} />

        <header className="mt-10">
          <p className="text-sm font-medium uppercase tracking-widest text-amber">Referrals</p>
          <h1 className="mt-6 text-5xl font-bold leading-[1.04] md:text-7xl">
            Know a business that needs a better website?
          </h1>
          <p className="mt-8 max-w-2xl text-lg text-muted md:text-xl">
            Introduce a hotel, lodge or restaurant to Apex Studios. If they become a client, we thank you with{' '}
            <span className="text-paper">{referral.reward}</span>.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            {wa && (
              <a href={wa} target="_blank" rel="noreferrer" className={`${button} bg-paper text-ink hover:bg-amber`}>
                Send a referral on WhatsApp
              </a>
            )}
            <Link to="/contact" className={`${button} border border-paper/25 hover:border-amber hover:text-amber`}>
              Or use the contact form
            </Link>
          </div>
        </header>

        <section aria-labelledby="how" className="mt-24">
          <h2 id="how" className="text-3xl font-bold md:text-5xl">
            How it works
          </h2>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {steps.map(([title, text], i) => (
              <li key={title} className="rounded-2xl border border-paper/10 bg-surface p-7">
                <span className="text-sm font-semibold text-amber">0{i + 1}</span>
                <h3 className="mt-4 text-2xl font-semibold">{title}</h3>
                <p className="mt-3 text-muted">{text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="who" className="mt-24 grid gap-10 md:grid-cols-2">
          <div>
            <h2 id="who" className="text-3xl font-bold md:text-5xl">
              Who it suits
            </h2>
            <ul className="mt-8 space-y-4 text-lg text-paper/80">
              {referral.who.map((w) => (
                <li key={w} className="flex gap-3">
                  <span aria-hidden="true" className="mt-2.5 h-2 w-2 flex-none rounded-full bg-amber" />
                  {w}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-paper/10 p-7 md:p-8">
            <h2 className="text-2xl font-semibold">Your own referral link</h2>
            <p className="mt-3 text-muted">
              Add <span className="text-paper">?ref=YourName</span> to the end of any page on this site and share it. When the
              person fills in our contact form, your name is attached to their message.
            </p>
            <p className="mt-4 rounded-lg bg-paper/10 px-4 py-3 text-xs text-paper/90 sm:text-sm">
              {origin}/contact?ref=YourName
            </p>
          </div>
        </section>

        <section aria-labelledby="terms" className="mt-24">
          <h2 id="terms" className="text-3xl font-bold md:text-5xl">
            The details
          </h2>
          <ul className="mt-8 max-w-3xl space-y-4 text-paper/75">
            {referral.terms.map((t) => (
              <li key={t} className="flex gap-3">
                <span aria-hidden="true" className="mt-2.5 h-1.5 w-1.5 flex-none rounded-full bg-paper/40" />
                {t}
              </li>
            ))}
          </ul>
          <p className="mt-8 text-sm text-muted">
            We handle the details you share under our <Link to="/privacy" className="text-amber hover:underline">Privacy Policy</Link>.
          </p>
        </section>

        <div className="mt-20">
          <Link to="/" className="font-semibold text-amber hover:underline">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
