import { useEffect, useRef } from 'react'
import { FX, calm, fine } from '../lib/fx'
import CursorHint from './CursorHint'

// Small, optional touches. Nothing here runs for visitors who prefer reduced motion,
// and the mouse effects never run on touch screens.
export default function Fx() {
  const bar = useRef(null)
  const glow = useRef(null)

  useEffect(() => {
    if (calm()) return undefined
    const root = document.documentElement
    const undo = []

    if (FX.progressBar && bar.current) {
      const el = bar.current
      let raf = 0
      const draw = () => {
        raf = 0
        const max = root.scrollHeight - window.innerHeight
        el.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`
      }
      const onScroll = () => {
        if (!raf) raf = requestAnimationFrame(draw)
      }
      draw()
      window.addEventListener('scroll', onScroll, { passive: true })
      window.addEventListener('resize', onScroll)
      undo.push(() => {
        window.removeEventListener('scroll', onScroll)
        window.removeEventListener('resize', onScroll)
        cancelAnimationFrame(raf)
      })
    }

    if (fine()) {
      const target = { x: 0, y: 0 }
      const cur = { x: 0, y: 0 }
      let raf = 0
      let magnet = null
      let card = null

      const loop = () => {
        cur.x += (target.x - cur.x) * 0.12
        cur.y += (target.y - cur.y) * 0.12
        if (FX.cursorGlow && glow.current) {
          glow.current.style.transform = `translate3d(${cur.x - 260}px, ${cur.y - 260}px, 0)`
        }
        if (FX.parallax) {
          const nx = (cur.x / window.innerWidth) * 2 - 1
          const ny = (cur.y / window.innerHeight) * 2 - 1
          document.querySelectorAll('[data-parallax]').forEach((el) => {
            const amount = Number(el.dataset.parallax) || 10
            el.style.translate = `${(-nx * amount).toFixed(1)}px ${(-ny * amount).toFixed(1)}px`
          })
        }
        const moving = Math.abs(target.x - cur.x) + Math.abs(target.y - cur.y) > 0.3
        raf = moving ? requestAnimationFrame(loop) : 0
      }

      const lean = (e) => {
        const el = FX.magnetic ? e.target.closest?.('a[class*="rounded-full"], button[class*="rounded-full"]') : null
        if (magnet && magnet !== el) {
          magnet.style.transform = ''
          magnet = null
        }
        if (!el || el.disabled) return
        magnet = el
        el.classList.add('is-magnetic')
        const r = el.getBoundingClientRect()
        const dx = (e.clientX - (r.left + r.width / 2)) / r.width
        const dy = (e.clientY - (r.top + r.height / 2)) / r.height
        el.style.transform = `translate(${(dx * 10).toFixed(1)}px, ${(dy * 8).toFixed(1)}px)`
      }

      const tilt = (e) => {
        const el = FX.tilt ? e.target.closest?.('[data-tilt]') : null
        if (card && card !== el) {
          card.style.transform = ''
          card = null
        }
        if (!el) return
        card = el
        const r = el.getBoundingClientRect()
        const x = (e.clientX - r.left) / r.width
        const y = (e.clientY - r.top) / r.height
        el.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`)
        el.style.setProperty('--my', `${(y * 100).toFixed(1)}%`)
        el.style.transform = `perspective(900px) rotateX(${((0.5 - y) * 6).toFixed(2)}deg) rotateY(${((x - 0.5) * 8).toFixed(2)}deg)`
      }

      const onMove = (e) => {
        target.x = e.clientX
        target.y = e.clientY
        if (!raf) raf = requestAnimationFrame(loop)
        if (glow.current) glow.current.dataset.on = '1'
        lean(e)
        tilt(e)
      }
      const onLeave = () => {
        if (glow.current) delete glow.current.dataset.on
        if (magnet) magnet.style.transform = ''
        if (card) card.style.transform = ''
        magnet = null
        card = null
      }

      window.addEventListener('pointermove', onMove, { passive: true })
      document.documentElement.addEventListener('mouseleave', onLeave)
      undo.push(() => {
        window.removeEventListener('pointermove', onMove)
        document.documentElement.removeEventListener('mouseleave', onLeave)
        cancelAnimationFrame(raf)
      })
    }

    return () => undo.forEach((fn) => fn())
  }, [])

  return (
    <>
      {FX.progressBar && <div ref={bar} className="scroll-progress" aria-hidden="true" />}
      {FX.cursorGlow && <div ref={glow} className="cursor-glow" aria-hidden="true" />}
      <CursorHint />
    </>
  )
}
