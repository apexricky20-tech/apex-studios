import { useEffect, useRef } from 'react'
import { seeded } from '../../lib/fields'
import { MODES } from './modes'

// One 2D canvas that runs one field (see modes.js). It stops when the tab is hidden or the canvas is off
// screen, runs at 30 frames a second on phones and older devices (tier 1), and caps the pixel ratio.
// local = the canvas sits inside a section (the footer) and measures its own scroll, instead of the page's.
export default function FieldCanvas({ mode, cfg = {}, seed = mode, tier = 2, local = false, className = 'page-field' }) {
  const ref = useRef(null)
  const cfgKey = JSON.stringify(cfg)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas.getContext('2d')
    const make = MODES[mode]
    if (!ctx || !make) return undefined
    const light = tier < 2
    const draw = make(JSON.parse(cfgKey), seeded(seed), light)
    const dpr = Math.min(window.devicePixelRatio || 1, light ? 1 : 1.5)
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    const s = { w: 0, h: 0, t: 0, dt: 0.016, p: 0, vel: 0, mx: 0, my: 0 }
    const mouse = { x: 0, y: 0 }
    let raf = 0
    let last = 0
    let lastY = window.scrollY
    let visible = true

    const size = () => {
      s.w = canvas.clientWidth
      s.h = canvas.clientHeight
      canvas.width = Math.round(s.w * dpr)
      canvas.height = Math.round(s.h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const frame = (now) => {
      raf = requestAnimationFrame(frame)
      if (light && now - last < 33) return
      const dt = Math.min(0.05, (now - last) / 1000 || 0.016)
      last = now
      const y = window.scrollY
      s.vel += ((y - lastY) / Math.max(dt, 0.001) / 1800 - s.vel) * 0.12
      lastY = y
      s.mx += (mouse.x - s.mx) * 0.06
      s.my += (mouse.y - s.my) * 0.06
      s.dt = dt
      s.t += dt
      if (local) {
        const r = canvas.getBoundingClientRect()
        s.p = Math.min(1, Math.max(0, (window.innerHeight - r.top) / (window.innerHeight + r.height)))
      } else {
        const max = document.documentElement.scrollHeight - window.innerHeight
        s.p = max > 0 ? Math.min(1, y / max) : 0
      }
      ctx.clearRect(0, 0, s.w, s.h)
      draw(ctx, s)
    }

    const run = () => {
      if (!raf && visible && !document.hidden) {
        last = performance.now()
        lastY = window.scrollY
        raf = requestAnimationFrame(frame)
      }
    }
    const stop = () => {
      cancelAnimationFrame(raf)
      raf = 0
    }
    const onMove = (e) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1
      mouse.y = (e.clientY / window.innerHeight) * 2 - 1
    }
    const onVis = () => (document.hidden ? stop() : run())

    size()
    const ro = new ResizeObserver(size)
    ro.observe(canvas)
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      if (visible) run()
      else stop()
    })
    io.observe(canvas)
    document.addEventListener('visibilitychange', onVis)
    if (fine) window.addEventListener('pointermove', onMove, { passive: true })
    run()
    return () => {
      stop()
      ro.disconnect()
      io.disconnect()
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('pointermove', onMove)
    }
  }, [mode, cfgKey, seed, tier, local])

  return <canvas ref={ref} className={className} />
}
