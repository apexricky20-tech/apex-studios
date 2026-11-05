// Runs after `vite build` (see the "build" script in package.json).
// It reads the built dist/index.html and writes, for every public page:
//   - its own <title>, description, canonical link, Open Graph and Twitter tags
//     straight into the HTML, so WhatsApp, Facebook and Google see them without running JavaScript
// It also writes dist/robots.txt and dist/sitemap.xml and adds LocalBusiness data to the homepage.
//
// When you get a custom domain, set SITE_URL in Cloudflare Pages
// (Settings > Variables and secrets) to e.g. https://apexstudios.co.ke and redeploy.
// Nothing else needs to change.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { contact } from '../src/data/contact.js'
import { projects } from '../src/data/projects.js'
import { articles } from '../src/data/articles.js'
import { websiteDesign } from '../src/data/websiteDesign.js'
import { development } from '../src/data/development.js'
import { automation } from '../src/data/automation.js'
import { branding } from '../src/data/branding.js'
import { googleBusinessProfile } from '../src/data/googleBusinessProfile.js'

const DEFAULT_SITE_URL = 'https://apex-studios-8xq.pages.dev'
const SITE_URL = (process.env.SITE_URL || DEFAULT_SITE_URL).replace(/\/+$/, '')
const SITE_NAME = 'Apex Studios'
const SHARE_IMAGE = `${SITE_URL}/og-image.png`
const SHARE_IMAGE_ALT = 'Apex Studios: websites for hotels, lodges and restaurants'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const template = join(dist, 'index.html')

if (!existsSync(template)) {
  console.error('seo: dist/index.html not found. Run `vite build` first.')
  process.exit(1)
}

const HOME_TITLE = 'Apex Studios | Websites for Hotels, Lodges and Restaurants'
const HOME_DESCRIPTION =
  'Apex Studios designs and builds fast, immersive websites for hotels, lodges and restaurants.'

const servicePages = [
  ['/website-design', websiteDesign],
  ['/development', development],
  ['/automation', automation],
  ['/branding', branding],
  ['/google-business-profile', googleBusinessProfile],
]

const routes = [
  { path: '/', title: HOME_TITLE, description: HOME_DESCRIPTION },
  {
    path: '/work',
    title: 'Our Work | Apex Studios',
    description: 'Selected website projects by Apex Studios, a web design and development studio in Nairobi, Kenya.',
  },
  {
    path: '/services',
    title: 'Services | Apex Studios',
    description:
      'Website design, development, automation, branding and Google Business Profile services for hotels, lodges and restaurants in Kenya.',
  },
  ...servicePages.map(([path, p]) => ({ path, title: p.title, description: p.description })),
  {
    path: '/process',
    title: 'Our Process | Apex Studios',
    description: 'How Apex Studios takes a hotel, lodge or restaurant website from the first call to launch and handover.',
  },
  {
    path: '/about',
    title: 'About Apex Studios | Websites for Hotels, Lodges and Restaurants in Kenya',
    description:
      'Apex Studios is a Nairobi studio that designs and builds websites, Google Business Profiles and brands for hotels, lodges and restaurants across Kenya.',
  },
  {
    path: '/contact',
    title: 'Contact Apex Studios | Start a Project in Kenya',
    description:
      'Tell Apex Studios about your hotel, lodge or restaurant. Share what you need and we will reply with the next step.',
  },
  {
    path: '/privacy',
    title: 'Privacy Policy | Apex Studios',
    description: 'What personal information the Apex Studios website collects, why, and how to ask us about it.',
  },
  {
    path: '/terms',
    title: 'Website Terms | Apex Studios',
    description: 'The terms for using the Apex Studios website.',
  },
  ...projects
    .filter((p) => p.published)
    .map((p) => ({ path: `/work/${p.slug}`, title: `${p.title} | Apex Studios`, description: p.summary })),
]

const publishedArticles = articles.filter((a) => a.published)
if (publishedArticles.length) {
  routes.push({
    path: '/articles',
    title: 'Articles | Apex Studios',
    description: 'Practical articles on websites for hotels, lodges and restaurants in Kenya.',
  })
  for (const a of publishedArticles) {
    routes.push({ path: `/articles/${a.slug}`, title: `${a.title} | Apex Studios`, description: a.title })
  }
}

// ---------- helpers ----------
const attr = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const text = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const jsonLd = (obj) =>
  `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`
const urlFor = (path) => (path === '/' ? `${SITE_URL}/` : `${SITE_URL}${path}`)

function businessData() {
  const sameAs = [contact.instagram, contact.tiktok].filter(Boolean)
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ProfessionalService',
        '@id': `${SITE_URL}/#business`,
        name: SITE_NAME,
        url: `${SITE_URL}/`,
        description: HOME_DESCRIPTION,
        logo: `${SITE_URL}/apple-touch-icon.png`,
        image: SHARE_IMAGE,
        ...(contact.email ? { email: contact.email } : {}),
        ...(contact.whatsapp ? { telephone: `+${contact.whatsapp}` } : {}),
        address: { '@type': 'PostalAddress', addressLocality: 'Nairobi', addressCountry: 'KE' },
        areaServed: { '@type': 'Country', name: 'Kenya' },
        knowsAbout: [
          'Website design',
          'Web development',
          'Business automation',
          'Branding',
          'Google Business Profile management',
        ],
        ...(sameAs.length ? { sameAs } : {}),
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: `${SITE_URL}/`,
        name: SITE_NAME,
        publisher: { '@id': `${SITE_URL}/#business` },
      },
    ],
  }
}

function headBlock(route) {
  const url = urlFor(route.path)
  const lines = [
    `<link rel="canonical" href="${attr(url)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${attr(SITE_NAME)}" />`,
    `<meta property="og:locale" content="en_KE" />`,
    `<meta property="og:title" content="${attr(route.title)}" />`,
    `<meta property="og:description" content="${attr(route.description)}" />`,
    `<meta property="og:url" content="${attr(url)}" />`,
    `<meta property="og:image" content="${attr(SHARE_IMAGE)}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${attr(SHARE_IMAGE_ALT)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${attr(route.title)}" />`,
    `<meta name="twitter:description" content="${attr(route.description)}" />`,
    `<meta name="twitter:image" content="${attr(SHARE_IMAGE)}" />`,
  ]
  if (route.path === '/') lines.push(jsonLd(businessData()))
  return lines.join('\n    ')
}

const html = readFileSync(template, 'utf8')
if (!html.includes('<!--seo-->')) {
  console.error('seo: the <!--seo--> marker is missing from index.html.')
  process.exit(1)
}

function render(route) {
  return html
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${text(route.title)}</title>`)
    .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${attr(route.description)}" />`)
    .replace('<!--seo-->', headBlock(route))
}

for (const route of routes) {
  const file = route.path === '/' ? template : join(dist, route.path, 'index.html')
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, render(route))
}

// ---------- robots.txt and sitemap.xml ----------
writeFileSync(
  join(dist, 'robots.txt'),
  ['User-agent: *', 'Disallow: /admin', 'Disallow: /api/admin/', '', `Sitemap: ${SITE_URL}/sitemap.xml`, ''].join('\n'),
)

const today = new Date().toISOString().slice(0, 10)
const entries = routes
  .map((r) => `  <url>\n    <loc>${text(urlFor(r.path))}</loc>\n    <lastmod>${today}</lastmod>\n  </url>`)
  .join('\n')
writeFileSync(
  join(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`,
)

console.log(`seo: ${routes.length} pages written for ${SITE_URL}`)
