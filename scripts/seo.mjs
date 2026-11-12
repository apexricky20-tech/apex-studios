// Runs after `vite build` (see the "build" script in package.json).
// It reads the built dist/index.html and writes, for every public page:
//   - its own <title>, description, canonical link, Open Graph and Twitter tags
//     straight into the HTML, so WhatsApp, Facebook and Google see them without running JavaScript
// It also writes dist/robots.txt, dist/sitemap.xml and dist/llms.txt, adds LocalBusiness data to the
// homepage, breadcrumb data to inner pages, and a plain-text version of each page inside the HTML
// (what search engines and AI crawlers that skip JavaScript read).
//
// Optional: set GOOGLE_SITE_VERIFICATION (the token from Google Search Console) to add the
// verification tag to every page.
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
import { serviceNames, pageNames } from '../src/lib/crumbs.js'
import { websiteDesign } from '../src/data/websiteDesign.js'
import { development } from '../src/data/development.js'
import { automation } from '../src/data/automation.js'
import { branding } from '../src/data/branding.js'
import { googleBusinessProfile } from '../src/data/googleBusinessProfile.js'
import { mpesaPayments } from '../src/data/mpesaPayments.js'
import { whatsappAutomation } from '../src/data/whatsappAutomation.js'
import { carePlans } from '../src/data/carePlans.js'

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
  ['/mpesa-payments', mpesaPayments],
  ['/whatsapp-automation', whatsappAutomation],
  ['/care-plans', carePlans],
]

const routes = [
  { path: '/', title: HOME_TITLE, description: HOME_DESCRIPTION, h1: 'Websites for hotels, lodges and restaurants' },
  {
    path: '/work',
    title: 'Our Work | Apex Studios',
    description: 'Selected website projects by Apex Studios, a web design and development studio in Nairobi, Kenya.',
  },
  {
    path: '/services',
    title: 'Services | Apex Studios',
    description:
      'Website design, development, automation, M-Pesa payments, WhatsApp automation, branding, Google Business Profile and website care plans for hotels, lodges and restaurants in Kenya.',
  },
  ...servicePages.map(([path, p]) => ({ path, title: p.title, description: p.description })),
  {
    path: '/process',
    title: 'Our Process | Apex Studios',
    description: 'How Apex Studios takes a hotel, lodge or restaurant website from the first call to launch and handover.',
  },
  {
    path: '/about',
    title: 'About Apex Studios | Nairobi Web Design Studio',
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
    routes.push({
      path: `/articles/${a.slug}`,
      title: `${a.title} | Apex Studios`,
      description: a.description || a.body?.[0] || a.title,
      article: a,
      lastmod: a.updated || a.date,
    })
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
  const sameAs = [contact.instagram, contact.tiktok, contact.youtube].filter(Boolean)
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


const faqs = [
  ['What does it cost?', 'Every project is quoted after a first call, once the scope is clear. Nothing is priced from a form.'],
  ['How long does it take?', 'It depends on the size of the site. You get a timeline with your quote.'],
  ['Can the website be updated without a developer?', 'Yes. You get a simple dashboard for posting updates, no developer needed.'],
  ['Will it work on phones?', 'Every site is built mobile-first and tested on real devices.'],
  ['Do you work with businesses outside Kenya?', 'Yes. We work remotely and the process is the same wherever you are.'],
]

function faqData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(([q, a]) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  }
}

function serviceData(route) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: serviceNames[route.path],
    description: route.description,
    url: urlFor(route.path),
    provider: { '@id': `${SITE_URL}/#business` },
    areaServed: { '@type': 'Country', name: 'Kenya' },
  }
}

function articleData(route) {
  const a = route.article
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: a.title,
    description: route.description,
    mainEntityOfPage: urlFor(route.path),
    datePublished: a.date,
    dateModified: a.updated || a.date,
    image: a.image && existsSync(join(root, 'public', a.image)) ? `${SITE_URL}${a.image}` : SHARE_IMAGE,
    author: { '@id': `${SITE_URL}/#business` },
    publisher: { '@id': `${SITE_URL}/#business` },
  }
}

const stripBrand = (t) => t.replace(/ \| Apex Studios$/, '')

function breadcrumbData(route) {
  const p = route.path
  if (p === '/') return null
  let trail
  if (serviceNames[p]) trail = [['Services', '/services'], [serviceNames[p], p]]
  else if (p.startsWith('/work/')) trail = [['Our Work', '/work'], [stripBrand(route.title), p]]
  else if (p.startsWith('/articles/')) trail = [['Articles', '/articles'], [stripBrand(route.title), p]]
  else trail = [[pageNames[p] || stripBrand(route.title), p]]
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [['Home', '/'], ...trail].map(([name, path], i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name,
      item: urlFor(path),
    })),
  }
}

// A plain-text version of the page. It sits inside #root, so it shows until the app loads and is
// what crawlers that do not run JavaScript read. The app replaces it as soon as it starts.
const shellLinks = [
  ['Home', '/'],
  ['Our work', '/work'],
  ['Services', '/services'],
  ['Our process', '/process'],
  ['About', '/about'],
  ['Contact', '/contact'],
  ['Privacy', '/privacy'],
]
function shell(route) {
  const links = shellLinks.map(([label, to]) => `<li><a href="${attr(to)}">${text(label)}</a></li>`).join('')
  const reach = [
    contact.email && `<a href="mailto:${attr(contact.email)}">${text(contact.email)}</a>`,
    contact.whatsapp && `<a href="https://wa.me/${attr(contact.whatsapp)}">WhatsApp</a>`,
  ].filter(Boolean)
  return (
    `<div class="shell" data-path="${attr(route.path)}">` +
    `<h1>${text(route.h1 || stripBrand(route.title))}</h1>` +
    `<p>${text(route.description)}</p>` +
    `<nav aria-label="Main"><ul>${links}</ul></nav>` +
    (reach.length ? `<p>${reach.join(' &middot; ')}</p>` : '') +
    `</div>`
  )
}

function headBlock(route) {
  const url = urlFor(route.path)
  // Articles share with their own picture when the file exists, otherwise the site-wide share image.
  const own = route.article?.image && existsSync(join(root, 'public', route.article.image))
  const image = own ? `${SITE_URL}${route.article.image}` : SHARE_IMAGE
  const imageHeight = own ? 750 : 630
  const imageAlt = own ? route.article.title : SHARE_IMAGE_ALT
  const lines = [
    `<link rel="canonical" href="${attr(url)}" />`,
    `<meta property="og:type" content="${route.article ? 'article' : 'website'}" />`,
    `<meta property="og:site_name" content="${attr(SITE_NAME)}" />`,
    `<meta property="og:locale" content="en_KE" />`,
    `<meta property="og:title" content="${attr(route.title)}" />`,
    `<meta property="og:description" content="${attr(route.description)}" />`,
    `<meta property="og:url" content="${attr(url)}" />`,
    `<meta property="og:image" content="${attr(image)}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="${imageHeight}" />`,
    `<meta property="og:image:alt" content="${attr(imageAlt)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${attr(route.title)}" />`,
    `<meta name="twitter:description" content="${attr(route.description)}" />`,
    `<meta name="twitter:image" content="${attr(image)}" />`,
  ]
  if (process.env.GOOGLE_SITE_VERIFICATION) {
    lines.push(`<meta name="google-site-verification" content="${attr(process.env.GOOGLE_SITE_VERIFICATION)}" />`)
  }
  if (route.path === '/') {
    lines.push(jsonLd(businessData()))
    lines.push(jsonLd(faqData()))
  }
  if (serviceNames[route.path]) lines.push(jsonLd(serviceData(route)))
  if (route.article) lines.push(jsonLd(articleData(route)))
  const crumbs = breadcrumbData(route)
  if (crumbs) lines.push(jsonLd(crumbs))
  return lines.join('\n    ')
}

const html = readFileSync(template, 'utf8')
if (!html.includes('<!--seo-->') || !html.includes('<!--shell-->')) {
  console.error('seo: the <!--seo--> or <!--shell--> marker is missing from index.html.')
  process.exit(1)
}

function render(route) {
  return html
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${text(route.title)}</title>`)
    .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${attr(route.description)}" />`)
    .replace('<!--seo-->', headBlock(route))
    .replace('<!--shell-->', shell(route))
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
  .map((r) => `  <url>\n    <loc>${text(urlFor(r.path))}</loc>\n    <lastmod>${r.lastmod || today}</lastmod>\n  </url>`)
  .join('\n')
writeFileSync(
  join(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`,
)

// ---------- llms.txt (a short, plain description of the site for AI assistants) ----------
const llmsLines = [
  `# ${SITE_NAME}`,
  '',
  `> ${SITE_NAME} is a web design and development studio in Nairobi, Kenya. It builds websites, Google Business Profiles, automation and branding for hotels, lodges and restaurants.`,
  '',
  '## Services',
  ...servicePages.map(([path, p]) => `- [${serviceNames[path]}](${urlFor(path)}): ${p.description}`),
  '',
  '## Work',
  ...projects.filter((p) => p.published).map((p) => `- [${p.title}](${urlFor(`/work/${p.slug}`)}): ${p.summary}`),
  '',
  '## About and contact',
  `- [About](${urlFor('/about')}): Who we are and how we work`,
  `- [Process](${urlFor('/process')}): How a project runs from first call to handover`,
  `- [Contact](${urlFor('/contact')}): Send a message to start a project`,
  ...(contact.email ? [`- Email: ${contact.email}`] : []),
  ...(contact.whatsapp ? [`- WhatsApp: https://wa.me/${contact.whatsapp}`] : []),
  '',
]
writeFileSync(join(dist, 'llms.txt'), llmsLines.join('\n'))

console.log(`seo: ${routes.length} pages written for ${SITE_URL}`)
