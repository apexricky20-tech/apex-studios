import { Link } from 'react-router-dom'

export default function Hero() {
  return (
    <section
      id="top"
      className="mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-6 pb-16 pt-32 md:grid-cols-[3fr_2fr] md:px-12"
    >
      <div className="min-w-0">
        <h1 className="text-[clamp(2.75rem,6.2vw,5.5rem)]">
          Websites that <span className="text-amber">fill</span> your rooms and tables.
        </h1>
        <p className="mt-8 max-w-md text-lg text-paper/70">
          Apex Studios designs and builds fast, immersive websites for hotels, lodges and
          restaurants, so guests find you, trust you, and book.
        </p>
        <Link
          to="/contact"
          className="mt-10 inline-block rounded-full bg-amber px-8 py-4 font-semibold text-ink"
        >
          Start a project
        </Link>
      </div>
      <div
        id="bell-slot"
        className="grid aspect-square place-items-center rounded-3xl border border-paper/10 text-paper/30"
      >
        3D bell goes here
      </div>
    </section>
  )
}
