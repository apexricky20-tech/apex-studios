import Hero from '../components/Hero'
import Services from '../components/Services'
import Marquee from '../components/Marquee'
import Work from '../components/Work'
import WhyChooseUs from '../components/WhyChooseUs'
import Process from '../components/Process'
import Faq from '../components/Faq'
import ProofStrip from '../components/ProofStrip'
import SiteCheck from '../components/SiteCheck'
import ArticlesSection from '../components/ArticlesSection'
import ClosingGem from '../components/ClosingGem'
import Testimonials from '../components/Testimonials'
import AmbientField from '../components/AmbientField'

export default function Home() {
  return (
    <>
      <title>Apex Studios | Websites, M-Pesa, Automation and AI for Hotels, Lodges and Restaurants</title>
      <div className="relative">
        <Hero />
        <div className="relative z-10 rounded-t-3xl border-t border-paper/10 bg-ink">
          <AmbientField />
          <ProofStrip />
          <SiteCheck />
          <Services />
          <Marquee />
          <Work />
          <Testimonials />
          <WhyChooseUs />
          <Process />
          <Faq />
          <ArticlesSection />
          <ClosingGem />
        </div>
      </div>
    </>
  )
}
