import Breadcrumbs from '../components/Breadcrumbs'
import Services from '../components/Services'

export default function ServicesPage() {
  return (
    <div className="pt-20">
      <title>Services | Apex Studios</title>
      <div className="mx-auto max-w-[2000px] px-gutter pt-10">
        <Breadcrumbs items={[{ name: 'Services' }]} />
      </div>
      <Services asPage />
    </div>
  )
}
