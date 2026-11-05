import { Link } from 'react-router-dom'
import Hero from '../components/Hero'
import Work from '../components/Work'
import Services from '../components/Services'
import Process from '../components/Process'
import Faq from '../components/Faq'

export default function Home() {
  return (
    <>
      <title>Apex Studios | Websites for Hotels, Lodges and Restaurants</title>
      <div className="relative">
        <Hero />
        <div className="relative z-10 rounded-t-3xl border-t border-paper/10 bg-ink">
          <Work />
          <Services />
          <Process />
          <Faq />
          <section className="mx-auto max-w-4xl px-6 py-24 text-center md:px-12 md:py-32">
            <h2 className="text-5xl md:text-7xl">Ready to fill your rooms?</h2>
            <Link
              to="/contact"
              className="mt-10 inline-block rounded-full bg-amber px-8 py-4 font-semibold text-ink"
            >
              Start a project
            </Link>
          </section>
        </div>
      </div>
    </>
  )
}
