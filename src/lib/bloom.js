// Shared state for the closing-section bloom. ServiceOrbit writes it (scroll, pointer, orbit angle),
// Gem3D reads it every frame. A plain mutable object on purpose: no React re-renders at 60 fps.
export const bloom = {
  p: 1, // 0 = every service is still inside the blob, 1 = all of them have settled on the ring
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
