// Typical price ranges in Kenya shillings. This is the single source of truth: the services list,
// every service page, the FAQ, the contact page, the SEO data and the chat assistant all read it.
// Change a number here and it changes everywhere after the next build.
export const pricing = {
  'Website Design': { from: 15000, to: 20000 },
  Development: { from: 25000, to: 50000 },
  Automation: { from: 15000, to: 25000 },
  Branding: { from: 15000, to: 20000 },
  'Google Business Profile': { from: 5000, to: 5000, fixed: true },
  'M-Pesa Payments': { from: 15000, to: 20000 },
  'WhatsApp Automation': { from: 15000, to: 20000 },
  'Care Plans': { from: 5000, to: 20000, monthly: true },
}

const kes = (n) => `KES ${n.toLocaleString('en-US')}`

// "KES 15,000 to 20,000", "KES 5,000 fixed", "KES 5,000 to 20,000 a month"
export function priceText(service) {
  const p = pricing[service]
  if (!p) return ''
  if (p.from === p.to) return `${kes(p.from)}${p.fixed ? ' fixed' : ''}${p.monthly ? ' a month' : ''}`
  return `${kes(p.from)} to ${p.to.toLocaleString('en-US')}${p.monthly ? ' a month' : ''}`
}

export const PRICE_NOTE =
  'The final price depends on the features you need, and we agree it with you in writing before any work starts.'

// Used by the FAQ (and its structured data), so keep it one plain paragraph.
export const COST_ANSWER = `Typical prices: website design ${priceText('Website Design')}, development ${priceText('Development')}, automation ${priceText('Automation')}, branding ${priceText('Branding')}, Google Business Profile ${priceText('Google Business Profile')}, M-Pesa payments ${priceText('M-Pesa Payments')}, WhatsApp automation ${priceText('WhatsApp Automation')} and care plans ${priceText('Care Plans')}. ${PRICE_NOTE}`
