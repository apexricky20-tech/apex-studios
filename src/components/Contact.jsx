import { useState } from 'react'

const field =
  'w-full rounded-xl border border-paper/20 bg-transparent px-4 py-3 outline-none focus:border-amber'

export default function Contact() {
  const [sent, setSent] = useState(false)

  const onSubmit = (e) => {
    e.preventDefault()
    setSent(true) // wired to a real inbox in Step 8
  }

  return (
    <section id="contact" className="mx-auto max-w-3xl px-6 py-24 md:px-12 md:py-32">
      <h2 className="text-5xl md:text-7xl">Tell us about your place.</h2>
      <p className="mt-6 text-lg text-paper/70">
        We'll show you what it could look like online.
      </p>
      {sent ? (
        <p className="mt-10 text-xl text-amber">Thanks, we'll be in touch shortly.</p>
      ) : (
        <form onSubmit={onSubmit} className="mt-10 grid gap-4">
          <input required name="name" placeholder="Your name" className={field} />
          <input required name="business" placeholder="Business name" className={field} />
          <input required name="contact" placeholder="Email or WhatsApp number" className={field} />
          <textarea name="message" rows="4" placeholder="What do you need?" className={field} />
          <div className="flex flex-wrap items-center gap-4">
            <button type="submit" className="rounded-full bg-amber px-8 py-4 font-semibold text-ink">
              Send
            </button>
            <a
              href="https://wa.me/254XXXXXXXXX"
              className="rounded-full border border-paper/30 px-8 py-4 font-semibold"
            >
              Chat on WhatsApp
            </a>
          </div>
        </form>
      )}
    </section>
  )
}
