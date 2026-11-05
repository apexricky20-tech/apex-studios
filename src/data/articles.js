// Only published articles appear on the live site. Drafts show in dev.
export const articles = [
  {
    slug: 'what-a-hotel-website-needs',
    title: 'What a Hotel Website Needs to Turn Visitors into Bookings',
    date: '2026-11-05',
    image: '/articles/hotel-website.webp',
    body: ['Draft. Write this article here.'],
    published: false,
  },
  {
    slug: 'restaurant-ordering-page',
    title: 'Why Your Restaurant Needs Its Own Ordering Page, Not Just Social Media',
    date: '2026-11-05',
    image: '/articles/ordering-page.webp',
    body: ['Draft. Write this article here.'],
    published: false,
  },
  {
    slug: 'mobile-speed-and-bookings',
    title: 'Why Mobile Speed Decides Whether Guests Book or Leave',
    date: '2026-11-05',
    image: '/articles/mobile-speed.webp',
    body: ['Draft. Write this article here.'],
    published: false,
  },
]

export const visibleArticles = () =>
  articles.filter((a) => a.published || import.meta.env.DEV)

export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
