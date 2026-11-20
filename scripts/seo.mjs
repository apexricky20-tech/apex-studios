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

import { contact as contactDefault } from '../src/data/contact.js'
import { projects as projectsDefault } from '../src/data/projects.js'
import { site as siteDefault } from '../src/data/site.js'
import { waHref, waMessage } from '../src/lib/whatsapp.js'
import { articles } from '../src/data/articles.js'
import { serviceNames, pageNames } from '../src/lib/crumbs.js'
import { websiteDesign } from '../src/data/websiteDesign.js'
import { development } from '../src/data/development.js'
import { automation } from '../src/data/automation.js'
import { branding } from '../src/data/branding.js'
import { googleBusinessProfile } from '../src/data/googleBusinessProfile.js'
import { mpesaPayments } from '../src/data/mpesaPayments.js'
import { whatsappAutomation } from '../src/data/whatsappAutomation.js'
import { threeDCreation } from '../src/data/threeDCreation.js'
import { uiUxDesign } from '../src/data/uiUxDesign.js'
import { motionDesign } from '../src/data/motionDesign.js'
import { aiAssistant } from '../src/data/aiAssistant.js'
import { carePlans } from '../src/data/carePlans.js'
import { COST_ANSWER } from '../src/data/pricing.js'

const DEFAULT_SITE_URL = 'https://apex-studios-8xq.pages.dev'
const SITE_URL = (process.env.SITE_URL || DEFAULT_SITE_URL).replace(/\/+$/, '')
const SITE_NAME = 'Apex Studios'
const SHARE_IMAGE = `${SITE_URL}/og-image.png`
const SHARE_IMAGE_ALT = 'Apex Studios: websites, payments, automation and AI for hotels, lodges and restaurants'

// Pages the owner edited in the dashboard live in KV, not in src/data. So the build asks the live site
// for them (GET /api/content is public and only returns published projects) and uses them instead of the
// built-in defaults. If the site cannot be reached (first deploy, offline build) the defaults are used.
// Set CONTENT_URL to read from somewhere else, or CONTENT_URL=off to skip this.
async function liveContent() {
  const src = process.env.CONTENT_URL ?? `${SITE_URL}/api/content`
  if (!src || src === 'off') return {}
  try {
    const res = await fetch(src, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) throw new Error(`status ${res.status}`)
    return await res.json()
  } catch (e) {
    console.warn(`seo: could not read dashboard content (${e.message}); using built-in defaults`)
    return {}
  }
}
const live = await liveContent()
const contact = { ...contactDefault }
for (const k of ['email', 'whatsapp', 'instagram', 'tiktok']) {
  if (typeof live.contact?.[k] === 'string' && live.contact[k].trim()) contact[k] = live.contact[k]
}
const projects = Array.isArray(live.projects) ? live.projects : projectsDefault
if (Array.isArray(live.projects)) console.log(`seo: using ${live.projects.length} published project(s) from the dashboard`)

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const template = join(dist, 'index.html')

if (!existsSync(template)) {
  console.error('seo: dist/index.html not found. Run `vite build` first.')
  process.exit(1)
}

const HOME_TITLE = 'Apex Studios | Websites, M-Pesa, Automation and AI for Hotels, Lodges and Restaurants'
const HOME_DESCRIPTION =
  'Apex Studios builds the digital systems hotels, lodges and restaurants in Kenya run on: websites, M-Pesa payments, WhatsApp automation, AI assistants and branding.'

const servicePages = [
  ['/website-design', websiteDesign],
  ['/development', development],
  ['/automation', automation],
  ['/branding', branding],
  ['/google-business-profile', googleBusinessProfile],
  ['/mpesa-payments', mpesaPayments],
  ['/whatsapp-automation', whatsappAutomation],
  ['/ai-assistant', aiAssistant],
  ['/care-plans', carePlans],
  ['/3d-creation', threeDCreation],
  ['/ui-ux-design', uiUxDesign],
  ['/motion-design', motionDesign],
]

const routes = [
  { path: '/', title: HOME_TITLE, description: HOME_DESCRIPTION, h1: 'Websites, payments, automation and AI for hotels, lodges and restaurants' },
  {
    path: '/work',
    title: 'Our Work | Apex Studios',
    description: 'Selected projects by Apex Studios, a digital studio in Nairobi, Kenya.',
  },
  {
    path: '/services',
    title: 'Services | Apex Studios',
    description:
      'Website design, development, automation, M-Pesa payments, WhatsApp automation, AI assistants, branding, Google Business Profile, website care plans, 3D creation, UI/UX design and motion design for hotels, lodges and restaurants in Kenya.',
  },
  ...servicePages.map(([path, p]) => ({ path, title: p.title, description: p.description })),
  {
    path: '/free-check',
    title: 'Free Website Speed and SEO Check for Hotels and Restaurants | Apex Studios',
    description:
      'Test your hotel, lodge or restaurant website for free. See how fast it loads on a phone, whether Google can read it, and the three fixes that matter most.',
    h1: 'Free digital check',
  },
  {
    path: '/process',
    title: 'Our Process | Apex Studios',
    description: 'How Apex Studios takes a hotel, lodge or restaurant website from the first call to launch and handover.',
  },
  {
    path: '/about',
    title: 'About Apex Studios | Nairobi Digital Studio',
    description:
      'Apex Studios is a Nairobi digital studio that builds websites, M-Pesa payments, WhatsApp automation, AI assistants and brands for hotels, lodges and restaurants across Kenya.',
  },
  {
    path: '/contact',
    title: 'Contact Apex Studios | Start a Project in Kenya',
    description:
      'Tell Apex Studios about your hotel, lodge or restaurant. Share what you need and we will reply with the next step.',
  },
  {
    path: '/refer',
    title: 'Refer a Client | Apex Studios',
    description:
      'Know a hotel, lodge or restaurant that needs a better website? Introduce them to Apex Studios and earn a reward when they become a client.',
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
    // The index changes when its newest article does.
    lastmod: publishedArticles.map((a) => a.updated || a.date).filter(Boolean).sort().pop(),
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
  ['What does it cost?', COST_ANSWER],
  ['How long does it take?', 'Most projects are delivered in 48 hours or less, and 72 hours at most, once you send your content and feedback quickly. You get the exact timeline with your quote.'],
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
// The home page's first screen, written straight into the HTML (same markup and classes as src/components/Hero.jsx),
// so the portrait and the call-to-action paint as soon as the CSS arrives instead of after the JavaScript has run.
// React then replaces it with the identical real thing; boot.js flags this so the intro animations do not replay.
function homeShell(route, linksHtml, reach) {
  const s = siteDefault
  const fade = 'linear-gradient(to bottom, black 70%, transparent 100%)'
  const wa = waHref(contact.whatsapp, waMessage('/'))
  const portrait = typeof s.portrait === 'string' && s.portrait.startsWith('/') ? s.portrait : ''
  return (
    `<div class="shell-hero relative" data-path="/">` +
    `<div class="sticky top-0 z-0 h-svh overflow-hidden bg-ink">` +
    `<div class="absolute inset-x-0 bottom-[46svh] top-20 flex justify-center md:bottom-[36svh]">` +
    (portrait
      ? `<img src="${attr(portrait)}" alt="${attr(`Portrait of ${s.name}, founder of Apex Studios`)}" fetchpriority="high" class="h-full w-auto max-w-full object-contain" style="mask-image:${fade};-webkit-mask-image:${fade}" />`
      : '') +
    `</div><div class="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink via-ink/80 to-transparent"></div></div>` +
    `<div class="relative z-10 -mt-[100svh] flex h-svh flex-col items-center justify-end px-gutter pb-8 text-center">` +
    `<h1 class="sr-only">${text(route.h1)}</h1>` +
    `<p class="max-w-2xl text-base text-paper md:text-lg">I&#39;m ${text(s.name)}. I build the digital systems hotels, lodges and restaurants run on: websites, M-Pesa payments, WhatsApp automation and AI assistants that turn visitors into direct bookings, orders and paying guests.</p>` +
    `<div class="mt-6 flex flex-wrap gap-3 justify-center">` +
    `<a href="/free-check" class="rounded-full bg-paper px-8 py-4 text-sm font-semibold uppercase tracking-wider text-ink transition-colors hover:bg-amber">Get a free digital check</a>` +
    (wa ? `<a href="${attr(wa)}" target="_blank" rel="noreferrer" class="rounded-full border border-paper/25 px-8 py-4 text-sm font-semibold uppercase tracking-wider transition-colors hover:border-amber hover:text-amber">Chat on WhatsApp</a>` : '') +
    `</div>` +
    `<ul class="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-paper/70">` +
    (s.available !== false
      ? `<li class="flex items-center gap-2 text-paper"><span class="relative flex h-2 w-2" aria-hidden="true"><span class="relative inline-flex h-2 w-2 rounded-full bg-[#12b76a]"></span></span>${text(s.availability)}</li>`
      : '') +
    `<li>${text(s.role)}</li><li>${text(s.location)}</li></ul>` +
    `<span class="mt-6 flex items-center gap-2 text-xs font-medium text-paper"><svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>Scroll to explore</span>` +
    `</div>` +
    `<nav class="sr-only" aria-label="Main"><ul>${linksHtml}</ul></nav>` +
    (reach.length ? `<p class="sr-only">${reach.join(' &middot; ')}</p>` : '') +
    `</div>`
  )
}

function shell(route) {
  const links = shellLinks.map(([label, to]) => `<li><a href="${attr(to)}">${text(label)}</a></li>`).join('')
  const reach = [
    contact.email && `<a href="mailto:${attr(contact.email)}">${text(contact.email)}</a>`,
    contact.whatsapp && `<a href="https://wa.me/${attr(contact.whatsapp)}">WhatsApp</a>`,
  ].filter(Boolean)
  if (route.path === '/') return homeShell(route, links, reach)
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
    // The hero portrait is the largest thing on the home page. Without this hint the browser only
    // discovers it after the JavaScript has run (measured: requested at ~3.0s on throttled mobile).
    // Home only, so inner pages never download a picture they do not show.
    const portrait = siteDefault.portrait
    if (typeof portrait === 'string' && portrait.startsWith('/')) {
      lines.unshift(`<link rel="preload" as="image" href="${attr(portrait)}" fetchpriority="high" />`)
    }
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
  ['User-agent: *', 'Disallow: /api/admin/', '', `Sitemap: ${SITE_URL}/sitemap.xml`, ''].join('\n'),
)

// <lastmod> is only written where we really know when the content changed (articles, and the articles index).
// Stamping every page with the build date tells Google "everything changed today" on every deploy,
// and Google learns to ignore the dates. A missing <lastmod> is fine; a wrong one is not.
const lastmodTag = (d) => (/^\d{4}-\d{2}-\d{2}$/.test(d || '') ? `\n    <lastmod>${d}</lastmod>` : '')
const entries = routes.map((r) => `  <url>\n    <loc>${text(urlFor(r.path))}</loc>${lastmodTag(r.lastmod)}\n  </url>`).join('\n')
writeFileSync(
  join(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`,
)

// ---------- llms.txt (a short, plain description of the site for AI assistants) ----------
const llmsLines = [
  `# ${SITE_NAME}`,
  '',
  `> ${SITE_NAME} is a digital studio in Nairobi, Kenya. It builds websites, M-Pesa payments, WhatsApp automation, AI assistants, Google Business Profiles and branding for hotels, lodges and restaurants.`,
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
