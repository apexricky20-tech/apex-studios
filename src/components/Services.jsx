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
]

export default function Services() {
  return (
    <section id="services" className="mx-auto max-w-[1400px] px-6 py-24 md:px-12 md:py-32">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-widest text-amber">02 / Services</p>
          <h2 className="mt-4 text-5xl md:text-7xl">What I build</h2>
        </div>
        <p className="max-w-md text-paper/70">
          Four services with one goal: helping hotels, lodges and restaurants get found,
          trusted and booked.
        </p>
      </div>

      <ul className="mt-16 border-t border-paper/15">
        {services.map((s, i) => {
          const flipped = i % 2 === 1
          return (
            <li
              key={s.title}
              className="group border-b border-paper/15 transition-colors duration-300 hover:bg-paper/[0.03]"
            >
              <div
                className={`flex flex-col gap-8 py-12 md:items-center md:gap-16 md:py-16 ${
                  flipped ? 'md:flex-row-reverse' : 'md:flex-row'
                }`}
              >
                <h3
                  className={`text-[clamp(2.5rem,5.2vw,5rem)] transition-colors duration-300 group-hover:text-amber md:flex-1 ${
                    flipped ? 'md:text-right' : ''
                  }`}
                >
                  {s.title}
                </h3>
                <div className="md:w-[34%]">
                  <p className="text-paper/80">{s.text}</p>
                  <ul className="mt-5 space-y-2 text-sm text-paper/60">
                    {s.items.map((item) => (
                      <li key={item} className="flex items-center gap-3">
                        <span
                          className="h-px w-4 shrink-0 bg-paper/30 transition-colors duration-300 group-hover:bg-amber"
                          aria-hidden="true"
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
