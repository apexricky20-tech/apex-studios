// Client reviews, kept apart from projects.js on purpose: the dashboard saves the whole `projects`
// array, so anything stored there can be overwritten. Wording is the client's own, trimmed with "...".
// `slug` links a review to a project, `services` to the service pages where it backs up the claim.
// Only show a rating the client actually gave: `score` for "10/10", `stars` for a star rating.
export const testimonials = [
  {
    id: 'patrick',
    slug: 'bullhead',
    name: 'Patrick W.',
    role: 'Owner',
    business: 'Bullhead',
    place: 'Emali',
    score: '10/10',
    featured: true,
    services: ['/website-design'],
    short: "They can now find us, something that they couldn't do before.",
    // Opening lines of the review, used as the big headline quote on the home page.
    lead: "Now truck drivers and people using Mombasa Nairobi highway can easily pre-order food. And they can now find us, something that they couldn't do before.",
    // Edited: "scumbled" -> "scrambled". Confirm light copy edits with the client.
    full: "Now truck drivers and people using Mombasa Nairobi highway can easily pre-order food. And they can now find us, something that they couldn't do before. On the other hand, locals can order food from where they are and their order reaches us with their real location pin so deliveries never get scrambled. I give them a clean 10/10 and I really recommend them to anybody else with the same business as Bullhead. They are so convenient and the delivery was super fast.",
  },
  {
    id: 'meshack',
    slug: 'bullhead',
    name: 'Meshack M.',
    role: 'Manager',
    business: 'Bullhead Hotels',
    place: 'Emali',
    services: ['/website-design', '/development'],
    short: 'Without ever needing to call a developer.',
    full: "The security and features in the admin dashboard made me feel ahead of time as I can edit menu, add pictures, speak to customers in form of the text strip directly from my dashboard to the live websites (main and the 2 branches) without ever needing to call a developer. And the websites' speed and overall functionality? Top notch.",
  },
  {
    id: 'simon',
    slug: 'digital-guest-house',
    name: 'Simon M.',
    role: 'Owner',
    business: 'Digital Guesthouse',
    place: 'Rombo',
    services: ['/google-business-profile'],
    short: 'Since they set up the Google Maps for my business things are never the same again.',
    full: "Honestly I never thought that I would get more bookings from Google before. I'd say since they set up the Google Maps for my business things are never the same again. More traffic, new customers daily... a huge win for me.",
  },
  {
    id: 'said',
    slug: 'mt-betheli-digital-guest-house',
    name: 'Said A.',
    role: 'Manager',
    business: 'Mt Betheli Digital Guesthouse B&B',
    place: 'Rombo',
    stars: 5,
    services: ['/google-business-profile'],
    short: 'Customers now come already knowing what to expect.',
    full: "More calls, more bookings... Finally we're now reaching people we would never think of. Customers now come already knowing what to expect. I highly recommend them.",
  },
]

export const forProject = (slug) => testimonials.filter((t) => t.slug === slug)
export const forService = (path) => testimonials.filter((t) => t.services?.includes(path))
