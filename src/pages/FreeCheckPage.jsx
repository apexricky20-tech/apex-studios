import Breadcrumbs from '../components/Breadcrumbs'
import SiteCheck from '../components/SiteCheck'

export default function FreeCheckPage() {
  return (
    <div className="px-gutter pt-40 md:pt-48">
      <title>Free Website Speed and SEO Check for Hotels and Restaurants | Apex Studios</title>
      <meta
        name="description"
        content="Test your hotel, lodge or restaurant website for free. See how fast it loads on a phone, whether Google can read it, and the three fixes that matter most."
      />
      <div className="mx-auto max-w-[1220px]">
        <Breadcrumbs items={[{ name: 'Free digital check' }]} />
        <h1 className="mt-8 text-[clamp(3rem,7vw,6.5rem)] font-medium">Free digital check</h1>
      </div>
      <SiteCheck heading="h2" id="check" title="How does your website look to a guest on a phone?" />
      <div className="mx-auto max-w-[1220px] pb-32">
        <h2 className="text-3xl md:text-5xl">What the check looks at</h2>
        <ul className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            ['Speed', 'How long a guest on mobile data waits before they can see and tap your page. Slow pages lose bookings before they load.'],
            ['Google search', 'Whether Google can read your pages and show them properly, with a title and description for each.'],
            ['Accessibility', 'Whether your text can be read and your buttons used by everyone, including guests with weak sight.'],
          ].map(([h, p]) => (
            <li key={h} className="rounded-2xl border border-paper/15 bg-surface p-6">
              <h3 className="text-2xl">{h}</h3>
              <p className="mt-3 text-muted">{p}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
