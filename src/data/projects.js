// Only published projects appear on the live site. Unpublished ones show in dev.
export const projects = [
  {
    slug: 'bullhead',
    title: 'Bullhead Hotel & Butchery',
    category: 'Website · Delivery ordering',
    image: '/projects/bullhead.webp',
    href: 'https://bullheadhotels.co.ke',
    published: true,
  },
  {
    slug: 'lodge-concept',
    title: 'Safari Lodge',
    category: 'Concept · Website',
    image: '/projects/lodge.webp',
    href: '/work',
    published: false,
  },
  {
    slug: 'boutique-concept',
    title: 'Boutique Hotel',
    category: 'Concept · Website',
    image: '/projects/boutique.webp',
    href: '/work',
    published: false,
  },
]

export const visibleProjects = () =>
  projects.filter((p) => p.published || import.meta.env.DEV)
