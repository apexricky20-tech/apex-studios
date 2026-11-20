// Only published projects appear on the live site. Unpublished ones show in dev.
//
// Optional extras per project. Add them when you have the files; a project without them looks as it does now.
//   video:  { src: '/projects/bullhead.mp4', webm: '/projects/bullhead.webm', poster: '/projects/bullhead.webp', alt: 'What the clip shows' }
//           A silent phone screen recording, portrait, about 10 to 20 seconds, under 1 MB (ffmpeg: -vf scale=540:-2 -crf 30 -an).
//           Put the files in public/projects/. It plays only while on screen, and never on data saver or a slow link.
//   before: { image: '/projects/bullhead-before.webp', alt: 'The old website' }
//           A screenshot of the old site at the same size as the main image. The main image is used as the "after".
export const projects = [
  {
    slug: 'bullhead',
    title: 'Bullhead Hotel & Butchery',
    category: 'Website · Delivery ordering',
    group: 'Websites',
    service: { label: 'Website Design', to: '/website-design' },
    image: '/projects/bullhead.webp',
    href: 'https://bullheadhotels.co.ke',
    live: 'bullheadhotels.co.ke',
    summary:
      'Bullhead Hotel & Butchery serves customers on the Mombasa highway from two branches in Emali. We built its website so people can find both branches and order delivery online.',
    solution:
      'A fast, mobile-first website with both branches clearly listed and a delivery ordering flow. Customers on the Mombasa highway can find both branches, and people who can only visit on weekends can order delivery instead.',
    location: 'Emali, Kenya',
    year: '2026',
    results: [
      {
        label: 'PageSpeed Insights, mobile',
        value: 'Performance 100 · Accessibility 96 · Best Practices 92 · SEO 100',
        note: 'Measured on 4 November 2026',
      },
      {
        label: 'Google Business Profile interactions, last 28 days',
        value: 'Branch 1: 106 · Branch 2: 86 · 192 combined',
        note: 'Calls, direction requests, website clicks and other actions taken from the two Google listings',
      },
    ],
    published: true,
  },
  {
    slug: 'lodge-concept',
    title: 'Safari Lodge',
    category: 'Concept · Website',
    group: 'Concepts',
    image: '/projects/lodge.webp',
    href: '/work',
    summary: 'Concept project.',
    solution: '',
    location: '',
    year: '',
    results: [],
    published: false,
  },
  {
    slug: 'boutique-concept',
    title: 'Boutique Hotel',
    category: 'Concept · Website',
    group: 'Concepts',
    image: '/projects/boutique.webp',
    href: '/work',
    summary: 'Concept project.',
    solution: '',
    location: '',
    year: '',
    results: [],
    published: false,
  },
  {
    slug: 'digital-guest-house',
    title: 'Digital Guest House',
    category: 'Google Business Profile',
    group: 'Google Business Profile',
    service: { label: 'Google Business Profile', to: '/google-business-profile' },
    image: '/projects/digital-guest-house.webp',
    href: 'https://share.google/ZtsVqJmrTZV5EJ8Iq',
    live: 'View on Google',
    liveLabel: 'Live profile',
    summary:
      'Digital Guest House is a guest house in Rombo, Kenya. Apex Studios manages its verified Google Business Profile.',
    solution:
      'A verified Google Business Profile, so travellers searching around Rombo can find the guest house on Google Maps and Search, see where it is and get in touch.',
    location: 'Rombo, Kenya',
    year: '2026',
    results: [
      {
        label: 'Google Business Profile interactions, last 28 days',
        value: '169 customer interactions',
        note: 'Total actions taken from the profile, as reported in Google Business Profile',
      },
    ],
    published: true,
  },
  {
    slug: 'mt-betheli-digital-guest-house',
    title: 'MT Betheli Digital Guest House B&B',
    category: 'Google Business Profile',
    group: 'Google Business Profile',
    service: { label: 'Google Business Profile', to: '/google-business-profile' },
    image: '/projects/mt-betheli.webp',
    href: 'https://share.google/wrDUZdhhk3oqKaa94',
    live: 'View on Google',
    liveLabel: 'Live profile',
    summary:
      'MT Betheli Digital Guest House B&B is a bed and breakfast in Rombo, Kenya. Apex Studios manages its verified Google Business Profile.',
    solution:
      'A verified Google Business Profile, so travellers searching around Rombo can find the B&B on Google Maps and Search, see where it is and get in touch.',
    location: 'Rombo, Kenya',
    year: '2026',
    results: [
      {
        label: 'Google Business Profile interactions, last 28 days',
        value: '234 customer interactions',
        note: 'Total actions taken from the profile, as reported in Google Business Profile',
      },
    ],
    published: true,
  },
]

export const visibleProjects = () =>
  projects.filter((p) => p.published || import.meta.env.DEV)
