import { FX, calm, fine } from './fx'

// Which background scene belongs to which page. The home page is left out on purpose,
// it already has its own 3D (the globe and the diamond).
const SCENES = {
  '/work': 'work',
  '/services': 'services',
  '/website-design': 'website',
  '/development': 'development',
  '/automation': 'automation',
  '/branding': 'branding',
  '/google-business-profile': 'profile',
  '/mpesa-payments': 'mpesa',
  '/whatsapp-automation': 'whatsapp',
  '/ai-assistant': 'assistant',
  '/care-plans': 'care',
  '/3d-creation': 'threeD',
  '/ui-ux-design': 'uiux',
  '/motion-design': 'motion',
  '/process': 'process',
  '/about': 'about',
  '/contact': 'contact',
  '/articles': 'articles',
  '/refer': 'refer',
  '/privacy': 'privacy',
  '/terms': 'terms',
}

export function sceneFor(pathname) {
  const p = pathname.replace(/\/+$/, '') || '/'
  if (p === '/') return null
  if (SCENES[p]) return SCENES[p]
  if (p.startsWith('/work/')) return 'work'
  if (p.startsWith('/articles/')) return 'articles'
  return 'lost' // the 404 page
}

// 0 = no 3D at all, 1 = light (phones, older devices), 2 = full.
// Visitors who ask for reduced motion or data saving never download the 3D code.
export function sceneTier() {
  if (typeof window === 'undefined' || !FX.scenes) return 0
  if (calm()) return 0
  const nav = navigator
  const conn = nav.connection
  if (conn?.saveData || /(^|-)2g$/.test(conn?.effectiveType || '')) return 0
  const light =
    window.innerWidth < 768 || !fine() || (nav.deviceMemory ?? 8) <= 4 || (nav.hardwareConcurrency ?? 8) <= 4
  return light ? 1 : 2
}

// Per-scene tweaks so a model never sits behind a heading. dx/dy nudge it on wide screens,
// s scales it, dim makes it fainter (1 = normal). Anything not listed uses the defaults.
export const PLACE = {
  work: { dx: 0.35 },
  services: { s: 0.9, dim: 0.35 },
  profile: { dy: -0.55, s: 0.85 },
  whatsapp: { dy: -0.55 },
  articles: { dx: 0.55 },
  refer: { dy: -0.9 },
  about: { dx: 0.8, s: 0.8, dim: 0.75 },
  terms: { dx: 0.2 },
}
