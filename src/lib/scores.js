// Pulls the four PageSpeed scores out of a result line such as
// "Performance 100 · Accessibility 96 · Best Practices 92 · SEO 100".
// Returns [] unless at least three real scores (0 to 100) are found, so a result the owner words
// differently in the dashboard simply shows as the plain text card it always was.
const RE = /(Performance|Accessibility|Best Practices|SEO)\s*:?\s*(\d{1,3})\b/gi

export function parseScores(text) {
  const out = []
  const seen = new Set()
  for (const m of String(text ?? '').matchAll(RE)) {
    const label = m[1].toLowerCase()
    const value = Number(m[2])
    if (value > 100 || seen.has(label)) continue
    seen.add(label)
    out.push({ label: m[1], value })
  }
  return out.length >= 3 ? out : []
}

export const isPageSpeed = (label) => /pagespeed|lighthouse/i.test(String(label ?? ''))
