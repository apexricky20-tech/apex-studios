import { useEffect, useRef } from 'react'
import { calm, fine } from '../lib/fx'
import './cursorHint.css'

// A small "Click here" tag that trails the mouse while it is over a clickable image (a card or link in
// the page that contains a picture: project cards, article cards). It sits beside the real cursor and
// never replaces it. Mouse and trackpad only; nothing runs on touch screens or for reduced motion.
// A link can set its own words with data-cursor="Read".
const TEXT = 'Click here'

export default function CursorHint() {
  const tag = useRef(null)

  useEffect(() => {
    if (calm() || !fine()) return undefined
    const el = tag.current
    const t = { x: -100, y: -100 }
    const c = { x: -100, y: -100 }
    let raf = 0
    let host = null

    const loop = () => {
      c.x += (t.x - c.x) * 0.25
      c.y += (t.y - c.y) * 0.25
      el.style.transform = `translate3d(${c.x.toFixed(1)}px, ${c.y.toFixed(1)}px, 0)`
      raf = Math.abs(t.x - c.x) + Math.abs(t.y - c.y) > 0.3 ? requestAnimationFrame(loop) : 0
    }
    const hide = () => {
      host = null
      delete el.dataset.on
    }
    const move = (e) => {
      if (e.pointerType && e.pointerType !== 'mouse') return
      t.x = e.clientX + 16
      t.y = e.clientY + 18
      const link = e.target.closest?.('main a[href], main button')
      const next = link && link.querySelector('img') && link.querySelector('img').style.display !== 'none' ? link : null
      if (next !== host) {
        if (next) {
          if (!el.dataset.on) {
            c.x = t.x
            c.y = t.y
          }
          el.textContent = next.dataset.cursor || TEXT
          el.dataset.on = '1'
          host = next
        } else hide()
      }
      if (host && !raf) raf = requestAnimationFrame(loop)
    }
    const onHidden = () => document.hidden && hide()

    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('scroll', hide, { passive: true })
    document.documentElement.addEventListener('mouseleave', hide)
    document.addEventListener('visibilitychange', onHidden)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('scroll', hide)
      document.documentElement.removeEventListener('mouseleave', hide)
      document.removeEventListener('visibilitychange', onHidden)
      cancelAnimationFrame(raf)
    }
  }, [])

  return <div ref={tag} className="cursor-hint" aria-hidden="true" />
}
