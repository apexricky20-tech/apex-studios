// Shared state for the closing-section bloom. ServiceOrbit writes it (scroll, pointer, orbit angle),
// Gem3D reads it every frame. A plain mutable object on purpose: no React re-renders at 60 fps.
export const bloom = {
  p: 1, // 0 = every service is still inside the blob, 1 = all of them have settled on the ring
  scale: 0.84, // blob size relative to its resting size (see SCALE), already includes the grow/dip
  angle: 0, // current orbit angle in radians
  w: 560, // width of the orbit box in px
  n: 12, // how many services are on the ring
  px: 0, // pointer, -1..1 across the orbit box (x right)
  py: 0, // pointer, -1..1 across the orbit box (y up)
}

export const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x)
export const easeOut = (t) => 1 - (1 - t) * (1 - t) * (1 - t)
export const smooth = (a, b, x) => {
  const t = clamp01((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}

// Each service has its own window inside 0..1 so they bud off one after another round the ring.
export const nodeT = (i, n, p) => clamp01((p - (i / n) * 0.45) / 0.55)

// Where service i sits on the ring, in px from the centre of the orbit box. d is 0 (back) to 1 (front).
export function slot(i, n, angle, w) {
  const a = angle + (i * Math.PI * 2) / n
  const s = Math.sin(a)
  return { x: Math.cos(a) * w * 0.42, y: s * w * 0.15, s, d: (s + 1) / 2 }
}

// ---- Scroll timeline -------------------------------------------------------------------------
// Two scroll-driven inputs, both 0..1, both pure functions of where the box is on screen, so the
// whole thing scrubs: scroll up and every step simply plays backwards.
//   m  enter: the box climbs into view.   0 .. GROW_END      the blob swells, services still inside
//                                         GROW_END .. DIP_END the blob eases back a touch (wind-up)
//                                         DIP_END .. 1        services leave one after another
//   x  exit:  the box leaves towards the footer. Services slide back into the blob in reverse order
//             and the blob returns to its original size.
export const SCALE = { rest: 1, peak: 1.42, dip: 1.2, ring: 0.84 }
export const GROW_END = 0.42
export const DIP_END = 0.58

export function timeline(m, x = 0) {
  const grow = smooth(0, GROW_END, m)
  const dip = smooth(GROW_END, DIP_END, m)
  const pop = clamp01((m - DIP_END) / (1 - DIP_END))
  const entered =
    SCALE.rest +
    (SCALE.peak - SCALE.rest) * grow -
    (SCALE.peak - SCALE.dip) * dip -
    (SCALE.dip - SCALE.ring) * smooth(0, 1, pop)
  const out = smooth(0, 1, clamp01(x))
  return { p: pop * (1 - out), scale: entered + (SCALE.rest - entered) * out }
}
