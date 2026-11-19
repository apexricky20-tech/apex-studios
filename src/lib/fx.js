// Tuning knobs for the extra polish. Set any of these to false to switch that effect off.
export const FX = {
  progressBar: true, // thin amber line at the top that fills as you scroll
  cursorGlow: false, // OFF on purpose: a blended 520px layer repainted on every mouse move, and it says nothing
  magnetic: true, // round buttons lean slightly towards the mouse (desktop only)
  tilt: true, // project cards tilt with a light sheen (desktop only)
  parallax: true, // hero portrait drifts slightly with the mouse (desktop only)
  pageFade: true, // gentle fade when moving between pages
  gem: true, // the 3D liquid-metal blob at the bottom of the home page (desktop and phones)
  scenes: true, // the faint 3D model behind each inner page
  fields: true, // the full-page background field behind each inner page, and the footer lamp
}

export const calm = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
export const fine = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches
