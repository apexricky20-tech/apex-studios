// The chat's "Book a free call" flow: plain helpers, no React.
// The assistant (an AI) does not collect these details. A fixed set of questions does, so nothing is misheard,
// invented or skipped. The finished request goes to the same inbox as the contact form (POST /api/contact).

// Only clear "I want a call" phrases. A bare "booking" must not match: hotel owners ask about booking features all the time.
export const BOOKING_INTENT =
  /\b(book (a|an|the|my|me)?\s*(free\s*)?(call|meeting|appointment|consultation|chat|slot)|appointment|(schedule|set up|arrange) (a|an|the)\s*(free\s*)?(call|meeting|consultation)|call me|call back|callback|consultation|miadi)\b/i

export const SERVICE_CHOICES = [
  'Website Design',
  'M-Pesa Payments',
  'WhatsApp Automation',
  'AI Assistant',
  'Branding',
  'Google Business Profile',
  'Not sure yet',
]
export const WHEN_CHOICES = ['Today', 'Tomorrow', 'This week', 'Next week']
export const MAX_PHOTOS = 3

// Keeps digits, a leading + and spaces. Needs at least 9 digits (same rule the server uses).
export function cleanPhone(raw) {
  const t = String(raw || '').replace(/[^\d+()\-\s]/g, '').trim()
  return t.replace(/\D/g, '').length >= 9 ? t.slice(0, 30) : ''
}

// Phones take 5 MB photos. Shrink in the browser first: smaller to send, and it fits the free storage limits.
const DEFAULT_ATTEMPTS = [
  [1280, 0.75],
  [1024, 0.55],
  [800, 0.5],
]
export async function shrinkPhoto(file, { attempts = DEFAULT_ATTEMPTS, maxBytes = 780 * 1024 } = {}) {
  if (!file.type.startsWith('image/')) throw new Error('That is not a photo. Please choose a JPEG, PNG or WebP image.')
  if (file.size > 25 * 1024 * 1024) throw new Error('That photo is over 25 MB. Please choose a smaller one.')
  let bmp
  try {
    bmp = await createImageBitmap(file)
  } catch {
    throw new Error('That photo could not be read. Try a JPEG, PNG or WebP image.')
  }
  for (const [max, quality] of attempts) {
    const scale = Math.min(1, max / Math.max(bmp.width, bmp.height))
    const c = document.createElement('canvas')
    c.width = Math.round(bmp.width * scale)
    c.height = Math.round(bmp.height * scale)
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height)
    // Older Safari cannot write WebP and quietly returns PNG, which is much bigger, so ask for JPEG there.
    let blob = await new Promise((res) => c.toBlob(res, 'image/webp', quality))
    if (!blob || blob.type !== 'image/webp') blob = await new Promise((res) => c.toBlob(res, 'image/jpeg', quality))
    if (blob && blob.size <= maxBytes) {
      bmp.close?.()
      return blob
    }
  }
  bmp.close?.()
  throw new Error('That photo is too detailed to send. Please try a different one.')
}

// Photos sent to the assistant are read as a base64 data URL, and the chat keeps a tiny thumbnail for its history.
export const blobToDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = () => reject(new Error('That photo could not be read. Try a JPEG, PNG or WebP image.'))
    r.readAsDataURL(blob)
  })

export async function thumbOf(blob, max = 180) {
  const bmp = await createImageBitmap(blob)
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height))
  const c = document.createElement('canvas')
  c.width = Math.max(1, Math.round(bmp.width * scale))
  c.height = Math.max(1, Math.round(bmp.height * scale))
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height)
  bmp.close?.()
  return c.toDataURL('image/jpeg', 0.6)
}

export async function uploadPhoto(blob) {
  const res = await fetch('/api/lead-photo', { method: 'POST', headers: { 'Content-Type': blob.type }, body: blob })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data.id) throw new Error(data.error || 'The photo could not be uploaded.')
  return data.id
}

export async function getFormToken() {
  try {
    const r = await fetch('/api/form-token')
    return { value: (await r.json()).token || '', at: Date.now() }
  } catch {
    return { value: '', at: Date.now() }
  }
}

export async function sendBooking({ data, photos, first, page, source, referrer, token }) {
  let t = token
  if (!t?.value) t = await getFormToken() // the first request failed (slow network): ask again
  const wait = 2300 - (Date.now() - t.at) // the server ignores forms sent faster than a person can type
  if (wait > 0) await new Promise((r) => setTimeout(r, wait))
  const message = [
    'Call request from the chat assistant.',
    `Needs: ${data.service}`,
    `Preferred time: ${data.when}`,
    data.note ? `Notes: ${data.note}` : null,
    photos.length ? `Photos attached: ${photos.length}` : null,
    `(Asked ${first} to confirm the time personally.)`,
  ]
    .filter(Boolean)
    .join('\n')
  const res = await fetch('/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: data.name,
      phone: data.phone,
      email: '',
      company: '',
      service: data.service === 'Not sure yet' ? 'Not sure yet' : data.service,
      message,
      page,
      source,
      referrer,
      via: 'chat',
      photos,
      formToken: t.value,
    }),
  })
  const out = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(out.error || 'Something went wrong while sending.')
}
