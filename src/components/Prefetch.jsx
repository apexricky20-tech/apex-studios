import { useEffect } from 'react'
import { warm } from '../lib/routes'

// Page code is split per route, so the first visit to a page used to wait for a download after the click.
// This starts that download earlier, on intent: a mouse resting on a link, a finger touching it, keyboard
// focus landing on it. A few small, high-value pages are also fetched once the browser is idle (the contact
// form is the one that matters most). Nothing runs for visitors on data saver or a 2G link.
// It fetches code only, never pages' data, and it never touches the DOM.
const IDLE_PAGES = ['/contact', '/work', '/services']

export default function Prefetch() {
  useEffect(() => {
    const conn = navigator.connection
    if (conn?.saveData || /(^|-)2g$/.test(conn?.effectiveType || '')) return undefined

    const intent = (e) => {
      const a = e.target?.closest?.('a[href]')
      if (!a || a.target === '_blank' || a.origin !== window.location.origin) return
      warm(a.pathname)
    }
    document.addEventListener('pointerover', intent, { passive: true })
    document.addEventListener('pointerdown', intent, { passive: true })
    document.addEventListener('focusin', intent)

    let idle = 0
    const timer = setTimeout(() => {
      const run = () => IDLE_PAGES.forEach((p) => warm(p))
      if ('requestIdleCallback' in window) idle = requestIdleCallback(run, { timeout: 4000 })
      else run()
    }, 2500)

    return () => {
      document.removeEventListener('pointerover', intent)
      document.removeEventListener('pointerdown', intent)
      document.removeEventListener('focusin', intent)
      clearTimeout(timer)
      if (idle) cancelIdleCallback(idle)
    }
  }, [])
  return null
}
