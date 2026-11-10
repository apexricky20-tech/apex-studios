// Remembers where a visitor came from, so a new enquiry can say "Came from: instagram / bio".
// Works with links you tag yourself, e.g. https://yoursite/?utm_source=instagram&utm_medium=bio
const KEY = 'apex_source'

export function captureSource() {
  try {
    const q = new URLSearchParams(window.location.search)
    const tagged = ['utm_source', 'utm_medium', 'utm_campaign']
      .map((k) => (q.get(k) || '').trim().slice(0, 40))
      .filter(Boolean)
      .join(' / ')
    let found = tagged
    if (!found && document.referrer) {
      const host = new URL(document.referrer).hostname.replace(/^www\./, '')
      if (host && host !== window.location.hostname.replace(/^www\./, '')) found = host
    }
    if (found && (tagged || !sessionStorage.getItem(KEY))) sessionStorage.setItem(KEY, found)
  } catch {
    // storage blocked or odd referrer: not important
  }
}

export function getSource() {
  try {
    return sessionStorage.getItem(KEY) || ''
  } catch {
    return ''
  }
}

// Tags links to client websites so they can see visits that came from your portfolio.
const SKIP = /(^|\.)(google\.com|share\.google|goo\.gl|instagram\.com|tiktok\.com|wa\.me|whatsapp\.com)$/
export function withUtm(href) {
  try {
    const u = new URL(href)
    if (!/^https?:$/.test(u.protocol) || SKIP.test(u.hostname)) return href
    if (!u.searchParams.has('utm_source')) {
      u.searchParams.set('utm_source', 'apexstudios')
      u.searchParams.set('utm_medium', 'portfolio')
    }
    return u.toString()
  } catch {
    return href
  }
}
