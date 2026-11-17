// Tuning knobs for the extra polish. Set any of these to false to switch that effect off.
export const FX = {
  progressBar: true, // thin amber line at the top that fills as you scroll
  cursorGlow: true, // soft amber light that follows the mouse (desktop only)
  magnetic: true, // round buttons lean slightly towards the mouse (desktop only)
  tilt: true, // project cards tilt with a light sheen (desktop only)
  parallax: true, // hero portrait drifts slightly with the mouse (desktop only)
  pageFade: true, // gentle fade when moving between pages
  gem: true, // the 3D liquid-metal blob at the bottom of the home page (desktop and phones)
  scenes: true, // the faint 3D model behind each inner page

  // ---- Stage: the choreography layer (src/lib/stage.js, src/stage.css) ----
  // `stage` is the master switch. If it is false, or the visitor asks for reduced motion, uses data saver,
  // or the device is very weak, none of the Stage code or CSS runs and the site looks exactly as before.
  // Emergency off without a deploy: open any page with ?fx=off (it remembers itself; ?fx=on undoes it).
  stage: true,
  shutter: true, // blinds lift open when you move between pages
  embers: true, // scrolling stokes a fire: amber embers rise from the bottom edge (desktop only)
  cursorLabel: true, // 'Step inside' bubble over project and article cards (desktop only)
  inertia: true, // the marquee ticker feels your scroll speed
  signature: true, // the logo signs itself once when the page opens
  bell: true, // after a few idle seconds the main button rings like a hotel service bell
}

export const calm = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
export const fine = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches
