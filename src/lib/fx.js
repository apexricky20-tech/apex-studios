// Tuning knobs for the extra polish. Set any of these to false to switch that effect off.
export const FX = {
  progressBar: true, // thin amber line at the top that fills as you scroll
  cursorGlow: true, // soft amber light that follows the mouse (desktop only)
  magnetic: true, // round buttons lean slightly towards the mouse (desktop only)
  tilt: true, // project cards tilt with a light sheen (desktop only)
  parallax: true, // hero portrait drifts slightly with the mouse (desktop only)
  pageFade: true, // gentle fade when moving between pages
  gem: true, // the 3D diamond near the bottom of the home page
}

export const calm = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
export const fine = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches
