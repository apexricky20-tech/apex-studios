// Pure helpers for the Stage layer (src/lib/stage.js). No DOM, no imports, so they can be unit tested.

export const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v))

// How far an element has travelled through the screen:
// 0 when its top edge touches the bottom of the screen, 1 when its bottom edge leaves the top.
export function progressOf(top, height, vh) {
  const span = vh + height
  return span > 0 ? clamp((vh - top) / span) : 0
}

// The hero: 0 at the very top of the page, 1 one full screen down.
export const heroProgress = (y, vh) => (vh > 0 ? clamp(y / vh) : 0)

// Marquee speed from scroll velocity (px per second, positive = down).
// Never zero or negative: a CSS animation played backwards from its first frame goes blank.
export function marqueeRate(vel) {
  if (!Number.isFinite(vel)) return 1
  return vel >= 0 ? 1 + Math.min(5, vel / 600) : 1 - Math.min(0.75, -vel / 1600)
}

// Embers born per second from scroll velocity. Scrolling up stokes the fire half as hard.
export function emberRate(vel) {
  if (!Number.isFinite(vel)) return 0
  const strength = clamp(Math.abs(vel) / 1100)
  return Math.round(strength * 70 * (vel < 0 ? 0.5 : 1))
}

// Frame governor: a frame longer than this (under ~22 fps) counts as slow.
export const SLOW_FRAME = 45
// After 90 scrolling frames, if more than a third were slow, the device is struggling.
export const isStruggling = (slow, total) => total >= 90 && slow / total > 0.35
