import { useNavigate } from 'react-router-dom'
import { calm } from './fx'

// Opening a case study grows the card's picture into the case study's header image instead of cutting.
// It uses the browser's View Transitions API where it exists (Chrome, Edge, Safari 18+); everywhere else,
// and for visitors who prefer reduced motion, the link simply navigates as it always did.
// The link stays a real <a href>, so it is still crawlable, middle-clickable and keyboard friendly.

const wait = (test, ms) =>
  new Promise((resolve) => {
    const t0 = performance.now()
    // setTimeout, not requestAnimationFrame: the browser pauses painting while a view transition waits
    // for its update, so animation frames would never arrive and the transition would time out.
    const tick = () => (test() || performance.now() - t0 > ms ? resolve() : setTimeout(tick, 16))
    tick()
  })

// True from the click until the transition has finished. Layout reads it once per page change, so the
// page's own fade-in is skipped for a morph and the two never fight.
export const morph = { active: false }

export function useMorphTo() {
  const navigate = useNavigate()
  return (e, to) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    if (typeof document.startViewTransition !== 'function' || calm()) return
    const img = e.currentTarget.querySelector('img')
    if (!img || img.style.display === 'none') return
    e.preventDefault()
    img.style.viewTransitionName = 'project-image'
    morph.active = true
    const run = document.startViewTransition(async () => {
      navigate(to)
      // The page is held still until the new header image exists (or 700 ms pass, so a slow
      // connection never feels frozen), then moved to the top so the picture lands in the right place.
      await wait(() => window.location.pathname === to && document.querySelector('img[data-morph-target]'), 700)
      window.scrollTo({ top: 0, behavior: 'instant' })
    })
    run.finished.finally(() => {
      img.style.viewTransitionName = ''
      morph.active = false
    })
  }
}
