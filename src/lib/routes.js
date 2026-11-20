// The one place that knows how to load each page. App.jsx lazy()s these loaders and the Prefetch
// component warms them up, so both resolve to the same module and Vite ships one chunk per page.
// A loader is just import(): calling it twice is free, the browser keeps the first result.
export const loaders = {
  work: () => import('../pages/WorkPage'),
  project: () => import('../pages/ProjectPage'),
  services: () => import('../pages/ServicesPage'),
  websiteDesign: () => import('../pages/WebsiteDesignPage'),
  googleBusinessProfile: () => import('../pages/GoogleBusinessProfilePage'),
  development: () => import('../pages/DevelopmentPage'),
  automation: () => import('../pages/AutomationPage'),
  branding: () => import('../pages/BrandingPage'),
  mpesa: () => import('../pages/MpesaPaymentsPage'),
  whatsapp: () => import('../pages/WhatsAppAutomationPage'),
  assistant: () => import('../pages/AiAssistantPage'),
  carePlans: () => import('../pages/CarePlansPage'),
  threeD: () => import('../pages/ThreeDCreationPage'),
  uiux: () => import('../pages/UiUxDesignPage'),
  motion: () => import('../pages/MotionDesignPage'),
  process: () => import('../pages/ProcessPage'),
  about: () => import('../pages/AboutPage'),
  contact: () => import('../pages/ContactPage'),
  articles: () => import('../pages/ArticlesPage'),
  article: () => import('../pages/ArticlePage'),
  privacy: () => import('../pages/PrivacyPage'),
  terms: () => import('../pages/TermsPage'),
  refer: () => import('../pages/ReferPage'),
  freeCheck: () => import('../pages/FreeCheckPage'),
  notFound: () => import('../pages/NotFound'),
  admin: () => import('../admin/Admin'),
}

const BY_PATH = {
  '/work': 'work',
  '/services': 'services',
  '/website-design': 'websiteDesign',
  '/google-business-profile': 'googleBusinessProfile',
  '/development': 'development',
  '/automation': 'automation',
  '/branding': 'branding',
  '/mpesa-payments': 'mpesa',
  '/whatsapp-automation': 'whatsapp',
  '/ai-assistant': 'assistant',
  '/care-plans': 'carePlans',
  '/3d-creation': 'threeD',
  '/ui-ux-design': 'uiux',
  '/motion-design': 'motion',
  '/process': 'process',
  '/about': 'about',
  '/contact': 'contact',
  '/articles': 'articles',
  '/privacy': 'privacy',
  '/terms': 'terms',
  '/refer': 'refer',
}

// Which loader a pathname needs, or null when there is nothing to fetch (the home page ships in the
// main bundle, and the dashboard is never warmed up on purpose).
export function routeKeyFor(pathname) {
  const p = String(pathname || '/').split(/[?#]/)[0].replace(/\/+$/, '') || '/'
  if (p === '/' || p === '/21') return null
  if (BY_PATH[p]) return BY_PATH[p]
  if (p.startsWith('/work/')) return 'project'
  if (p.startsWith('/articles/')) return 'article'
  return null
}

const started = new Map()

// Start downloading the code for a page. Safe to call as often as you like. Resolves when it is ready;
// resolves to false (never rejects) if the download failed, and a later call will try again.
export function warm(pathname) {
  const key = routeKeyFor(pathname)
  if (!key) return Promise.resolve(true)
  if (!started.has(key)) {
    started.set(
      key,
      loaders[key]().then(
        () => true,
        () => {
          started.delete(key)
          return false
        },
      ),
    )
  }
  return started.get(key)
}
