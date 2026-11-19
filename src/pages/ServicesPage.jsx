import Breadcrumbs from '../components/Breadcrumbs'
import Services from '../components/Services'

export default function ServicesPage() {
  return (
    <div className="pt-20">
      <title>Services: Websites, M-Pesa, WhatsApp and AI for Hotels | Apex Studios</title>
      <meta name="description" content="Twelve services for hotels, lodges and restaurants in Kenya: website design, M-Pesa payments, WhatsApp automation, AI assistants, branding and care plans." />
      <div className="mx-auto max-w-[2000px] px-gutter pt-10">
        <Breadcrumbs items={[{ name: 'Services' }]} />
      </div>
      <Services asPage />
    </div>
  )
}
