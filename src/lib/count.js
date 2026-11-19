// Splits a result line such as "Branch 1: 106 · Branch 2: 86 · 192 combined" into plain text and the
// numbers worth counting up. Small numbers ("Branch 1"), years, times, "24/7" and "3D" stay as plain text,
// so a line the owner words differently in the dashboard never turns into something silly.
const RE = /\d[\d,]*(?:\.\d+)?/g

export function splitNumbers(text) {
  const s = String(text ?? '')
  const parts = []
  let last = 0
  for (const m of s.matchAll(RE)) {
    const raw = m[0]
    const n = Number(raw.replace(/,/g, ''))
    const prev = s[m.index - 1] ?? ''
    const next = s[m.index + raw.length] ?? ''
    const year = !raw.includes(',') && Number.isInteger(n) && n >= 1900 && n <= 2100
    const glued = /[A-Za-z/:]/.test(prev) || /[A-Za-z/:]/.test(next)
    if (!Number.isFinite(n) || n < 10 || year || glued) continue
    if (m.index > last) parts.push({ text: s.slice(last, m.index) })
    parts.push({ to: n, decimals: raw.includes('.') ? raw.split('.')[1].length : 0, comma: raw.includes(','), text: raw })
    last = m.index + raw.length
  }
  if (last < s.length) parts.push({ text: s.slice(last) })
  return parts
}

export function formatCount(value, { decimals = 0, comma = false } = {}) {
  const v = decimals ? value.toFixed(decimals) : String(Math.round(value))
  return comma ? Number(v).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) : v
}
