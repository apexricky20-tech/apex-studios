import { Link } from 'react-router-dom'

// Add a line here when a service gets its own page
const pages = {
  'Website Design': '/website-design',
  'Google Business Profile': '/google-business-profile',
  Development: '/development',
  Automation: '/automation',
  Branding: '/branding',
}

const services = [
  {
    title: 'Website Design',
    text: 'Websites shaped around your place: the rooms, the food, the feeling. Every page is designed so a guest can find what they need and book in a few taps.',
    items: [
      'Mobile-first page design',
      'Menu, rooms and gallery layouts',
      'Booking and enquiry paths',
      'Copy and content structure',
    ],
  },
  {
    title: 'Development',
    text: 'Fast, dependable sites and web apps built with modern tools. Pages load quickly on any phone, and you can update your own content without calling a developer.',
    items: [
      'Responsive build with React',
      'Content dashboard you control',
      'Speed and SEO built in',
      'Hosting and launch setup',
    ],
  },
  {
    title: 'Automation',
    text: 'Software and integrations that take over the repetitive work, like orders, enquiries and confirmations, so your team gets its hours back for guests.',
    items: [
      'Online ordering and delivery flows',
      'WhatsApp and email notifications',
      'Booking and enquiry routing',
      'Admin dashboards',
    ],
  },
  {
    title: 'Branding',
    text: 'A visual identity that feels like your place. Logo, colors and type that stay consistent from the sign above the door to the menu on a phone screen.',
    items: [
      'Logo and wordmark',
      'Color and type system',
      'Menu and social templates',
      'Brand guidelines',
    ],
  },
  {
    title: 'Google Business Profile',
    text: 'A complete, active Google Business Profile so customers find you on Maps and Search, with the right hours, photos, services and contact options.',
    items: [
      'Profile setup and verification',
      'Hours, photos and service details',
      'Posts, updates and review replies',
      'Performance tracking and reports',
    ],
  },
]

export default function Services() {
  return (
    <section id="services" className="mx-auto max-w-[2000px] px-gutter py-24  md:py-32">
      <div className="sr-only">
        <div>
          <p className="text-sm uppercase tracking-widest text-amber">Services</p>
          <h2 className="mt-4 text-5xl md:text-7xl">What we build</h2>
        </div>
        <p className="max-w-md text-paper/70">
          Five services with one goal: helping hotels, lodges and restaurants get found,
          trusted and booked.
        </p>
      </div>

      <ul className="border-t border-paper/15">
        {services.map((s, i) => {
          const flipped = i % 2 === 1
          const to = pages[s.title]
          const Row = to ? Link : 'div'
          const rowProps = to ? { to } : {}
          return (
            <li
              key={s.title}
              className="group border-b border-paper/15"
            >
              <Row
                {...rowProps}
                className={`flex flex-col gap-8 py-12 md:items-center md:gap-16 md:py-16 ${
                  flipped ? 'md:flex-row-reverse' : 'md:flex-row'
                }`}
              >
                <h3
                  className={`text-[clamp(2.75rem,7.2vw,8.5rem)] transition-colors duration-200 group-hover:text-amber md:flex-1 ${
                    flipped ? 'md:text-right' : ''
                  }`}
                >
                  {s.title}
                </h3>
                <div className="md:w-[38%] lg:w-[30%]">
                  <p className="text-paper/80">{s.text}</p>
                  <ul className="mt-5 space-y-2 text-sm text-muted">
                    {s.items.map((item) => (
                      <li key={item} className="flex items-center gap-3">
                        <span
                          className="h-px w-4 shrink-0 bg-paper/30"
                          aria-hidden="true"
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </Row>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
