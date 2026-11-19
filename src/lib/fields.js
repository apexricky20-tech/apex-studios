import { sceneFor } from './scene3d.js'

// Full-page background fields for the inner pages (the home page keeps its own Constellation).
// Seven kinds exist, six for pages and one for the footer (see components/fields/modes.js).
// Every page gets its own seed, so two pages that share a kind still lay themselves out differently,
// and its own tuning below. Keyed by the scene ids of lib/scene3d.js.
export const FIELDS = {
  work: { mode: 'bokeh', amber: 0.4, dim: 1 },
  services: { mode: 'bokeh', n: 1.4, amber: 0.55, dim: 0.9 },
  refer: { mode: 'bokeh', n: 0.8, amber: 0.3, dim: 0.9 },
  care: { mode: 'bokeh', n: 0.7, amber: 0.2, dim: 0.9 },
  website: { mode: 'ribbons', lines: 22, speed: 1, dim: 1 },
  branding: { mode: 'ribbons', lines: 16, speed: 0.7, dim: 1 },
  threeD: { mode: 'ribbons', lines: 28, speed: 1.2, dim: 0.9 },
  uiux: { mode: 'ribbons', lines: 14, speed: 0.9, dim: 0.9 },
  motion: { mode: 'ribbons', lines: 20, speed: 1.6, dim: 1 },
  development: { mode: 'flow', n: 1, scale: 1.2, amber: 0.12, dim: 1 },
  automation: { mode: 'flow', n: 1.2, scale: 0.8, amber: 0.2, dim: 1 },
  assistant: { mode: 'flow', n: 0.8, scale: 1.6, amber: 0.25, dim: 0.9 },
  whatsapp: { mode: 'flow', n: 1, scale: 1, amber: 0.3, dim: 0.9 },
  profile: { mode: 'windows', lit: 0.16, amber: 0.5, dim: 0.9 },
  mpesa: { mode: 'windows', lit: 0.1, amber: 0.8, dim: 0.9 },
  contact: { mode: 'windows', lit: 0.2, amber: 0.55, dim: 1 },
  process: { mode: 'threads', dim: 1 },
  about: { mode: 'shaft', beams: 3, motes: 1, dim: 1 },
  articles: { mode: 'shaft', beams: 2, motes: 0.7, dim: 0.8 },
  terms: { mode: 'shaft', beams: 2, motes: 0.5, dim: 0.5 },
  privacy: { mode: 'shaft', beams: 2, motes: 0.5, dim: 0.5 },
  lost: { mode: 'shaft', beams: 4, motes: 1.2, dim: 0.9 },
}

export function fieldFor(pathname) {
  const id = sceneFor(pathname)
  return id && FIELDS[id] ? { id, ...FIELDS[id] } : null
}

// Small seeded random generator (mulberry32), so a page always lays its field out the same way.
export function seeded(text) {
  let h = 1779033703
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 3432918353)
  let a = (h ^ (h >>> 16)) >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
