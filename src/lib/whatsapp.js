import { serviceNames } from './crumbs.js'

// Builds a wa.me link with a ready-typed message. Returns '' when no number is set.
export function waHref(number, text) {
  const digits = String(number || '').replace(/\D/g, '')
  return digits ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}` : ''
}

// The opening message says which page the visitor was on, so you can see which pages bring chats.
export function waMessage(pathname, topic) {
  const service = serviceNames[pathname]
  const about = topic || (service ? `${service} for my business` : 'a website for my business')
  const where = pathname === '/' ? '' : ` (page: ${pathname})`
  return `Hi Apex Studios, I found you on your website and I'd like to talk about ${about}.${where}`
}
