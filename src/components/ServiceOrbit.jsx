import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { calm } from '../lib/fx'
import { bloom, clamp01, easeOut, nodeT, slot, smooth, timeline } from '../lib/bloom'

// Simple 24x24 line glyphs, one per service. Add a line here when a service gets a page.
const SERVICES = [
  { label: 'Website Design', to: '/website-design', d: 'M4 5h16v11H4z M8 20h8 M12 16v4' },
  { label: 'Development', to: '/development', d: 'M9 8l-4 4 4 4 M15 8l4 4-4 4' },
  { label: 'Automation', to: '/automation', d: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z M12 3v3 M12 18v3 M3 12h3 M18 12h3 M5.6 5.6l2.1 2.1 M16.3 16.3l2.1 2.1 M18.4 5.6l-2.1 2.1 M7.7 16.3l-2.1 2.1' },
  { label: 'Branding', to: '/branding', d: 'M12 3l7 8-7 10-7-10z M5 11h14' },
  { label: 'Google Business Profile', to: '/google-business-profile', d: 'M12 21s-6-5.2-6-10a6 6 0 1 1 12 0c0 4.8-6 10-6 10z M12 9a2 2 0 1 0 0 4 2 2 0 0 0 0-4z' },
  { label: 'M-Pesa Payments', to: '/mpesa-payments', d: 'M8 2h8a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z M10 11l1.6 1.6L14.5 9 M11 18h2' },
  { label: 'WhatsApp Automation', to: '/whatsapp-automation', d: 'M4 5h16v11H10l-4 4v-4H4z M8 9h8 M8 12h5' },
  { label: 'AI Assistant', to: '/ai-assistant', d: 'M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z' },
  { label: 'Care Plans', to: '/care-plans', d: 'M3 12h4l2-5 3 10 2-5h7' },
  { label: '3D Creation', to: '/3d-creation', d: 'M12 3l8 4.5v9L12 21l-8-4.5v-9z M4 7.5l8 4.5 8-4.5 M12 12v9' },
  { label: 'UI/UX Design', to: '/ui-ux-design', d: 'M6 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4z M18 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4z M12 16a2 2 0 1 0 0 4 2 2 0 0 0 0-4z M8 6h8 M7 8l4 8 M17 8l-4 8' },
  { label: 'Motion Design', to: '/motion-design', d: 'M8 5l11 7-11 7z' },
]
const PHONE_SET = ['Website Design', 'Automation', 'M-Pesa Payments', 'AI Assistant']

// Where the box centre sits on screen (0 = top edge, 1 = bottom edge) while the bloom plays.
// Enter: starts as the box rises into view, finished just above the middle of the screen.
// Exit: starts once it has climbed past the upper third, finished as it leaves towards the footer.
const ENTER_FROM = 0.95
const ENTER_TO = 0.42
const EXIT_FROM = 0.32
const EXIT_TO = -0.05

// Ring of service links circling whatever is passed as children (the blob).
// Plain HTML links on a CSS transform loop: no extra GPU work, and they stay real, crawlable links.
// With `bloomOn`, scrolling plays a timeline (lib/bloom.js `timeline`): the blob swells with the
// services still inside, eases back a touch, then they leave one by one. Scrolling on towards the
// footer plays it backwards: they slide back in and the blob returns to its original size. The
// 3D canvas reads the same shared state, and the pointer position is shared the same way.
export default function ServiceOrbit({ running, bloomOn = false, children }) {
  const box = useRef(null)
  const items = useRef([])
  const [phone] = useState(() => window.matchMedia('(max-width: 767px)').matches)
  const list = useMemo(() => (phone ? SERVICES.filter((s) => PHONE_SET.includes(s.label)) : SERVICES), [phone])

  useEffect(() => {
    const el = box.current
    const nodes = items.current.slice(0, list.length)
    const base = 0.14 // radians per second, about 45s per turn
    let width = el.clientWidth
    let angle = 0
    let speed = base
    let base_target = base
    let paused = false
    let raf = 0
    let last = 0

    // Scroll progress of the bloom: m while entering, x while leaving towards the footer (see lib/bloom.js),
    // pointer basis and the "keyboard has focus in the ring" override.
    let targetM = bloomOn ? 0 : 1
    let targetX = 0
    let shownM = targetM
    let shownX = 0
    let forced = false
    // Lets the closing section's button catch the light once the services have settled on the ring.
    const section = el.closest('section')
    let sawLow = false
    let lit = false
    let cx = 0
    let cy = 0
    let half = 1
    const measure = () => {
      const r = el.getBoundingClientRect()
      cx = r.left + r.width / 2
      cy = r.top + r.height / 2
      half = Math.max(r.width / 2, 1)
      if (!bloomOn) return
      const vh = window.innerHeight
      const at = cy / vh
      const byBox = clamp01((ENTER_FROM - at) / (ENTER_FROM - ENTER_TO))
      // On tall screens the page may end before the box reaches the middle: finish the bloom at the end.
      const left = document.documentElement.scrollHeight - (window.scrollY + vh)
      targetM = Math.max(byBox, clamp01(1 - left / 240))
      targetX = clamp01((EXIT_FROM - at) / (EXIT_FROM - EXIT_TO))
    }

    const place = () => {
      const tl = forced ? timeline(1, 0) : timeline(shownM, shownX)
      bloom.p = tl.p
      bloom.scale = tl.scale
      if (bloomOn && running) {
        if (tl.p < 0.3) sawLow = true
        else if (tl.p > 0.97 && sawLow && !lit) {
          lit = true
          section?.setAttribute('data-bloomed', '')
        }
      }
      bloom.angle = angle
      bloom.w = width
      bloom.n = nodes.length
      nodes.forEach((node, i) => {
        if (!node) return
        const sl = slot(i, nodes.length, angle, width)
        const t = nodeT(i, nodes.length, tl.p)
        const e = easeOut(t)
        node.style.transform = `translate(-50%,-50%) translate(${sl.x * e}px,${sl.y * e}px) scale(${Math.max((0.72 + 0.38 * sl.d) * smooth(0.6, 1, t), 0.01)})`
        node.style.opacity = String((0.4 + 0.6 * sl.d) * smooth(0.7, 1, t))
        node.style.pointerEvents = t > 0.9 ? '' : 'none'
        node.style.zIndex = sl.s > 0 ? '2' : '0'
      })
    }
    const tick = (now) => {
      raf = 0
      const dt = Math.min((now - (last || now)) / 1000, 0.05)
      last = now
      speed += ((paused ? 0 : base_target) - speed) * Math.min(dt * 5, 1)
      angle += speed * dt
      const k = Math.min(dt * 8, 1)
      shownM += (targetM - shownM) * k
      shownX += (targetX - shownX) * k
      place()
      raf = requestAnimationFrame(tick)
    }

    const ro = new ResizeObserver(() => {
      width = el.clientWidth
      place()
    })
    ro.observe(el)
    const hold = () => (paused = true)
    const release = () => (paused = false)
    const steer = (e) => {
      const r = el.getBoundingClientRect()
      base_target = base + Math.max(-1, Math.min(1, (e.clientX - r.left - r.width / 2) / r.width)) * 0.12
    }
    const list_ = el.querySelector('ul')
    list_.addEventListener('pointerover', hold)
    list_.addEventListener('pointerleave', release)
    list_.addEventListener('focusin', hold)
    list_.addEventListener('focusout', release)
    el.addEventListener('pointermove', steer)

    const follow = (e) => {
      if (e.pointerType === 'touch') return // a finger is scrolling, not aiming
      bloom.px = (e.clientX - cx) / half
      bloom.py = (cy - e.clientY) / half
    }
    const rest = () => {
      bloom.px = 0
      bloom.py = 0
    }
    const open = () => (forced = true)
    const close = () => (forced = false)
    const live = bloomOn && running
    if (bloomOn) {
      list_.addEventListener('focusin', open)
      list_.addEventListener('focusout', close)
    }
    if (live) {
      window.addEventListener('scroll', measure, { passive: true })
      window.addEventListener('resize', measure, { passive: true })
      window.addEventListener('pointermove', follow, { passive: true })
      document.documentElement.addEventListener('pointerleave', rest)
    }
    measure()
    shownM = targetM
    shownX = targetX
    place()
    if (running && !calm()) raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      list_.removeEventListener('pointerover', hold)
      list_.removeEventListener('pointerleave', release)
      list_.removeEventListener('focusin', hold)
      list_.removeEventListener('focusout', release)
      el.removeEventListener('pointermove', steer)
      list_.removeEventListener('focusin', open)
      list_.removeEventListener('focusout', close)
      window.removeEventListener('scroll', measure)
      window.removeEventListener('resize', measure)
      window.removeEventListener('pointermove', follow)
      document.documentElement.removeEventListener('pointerleave', rest)
      section?.removeAttribute('data-bloomed')
      rest()
    }
  }, [running, list, bloomOn])

  return (
    <div ref={box} className="relative mx-auto aspect-square w-full max-w-[560px]">
      <div className="pointer-events-none absolute inset-[12%] bg-[radial-gradient(circle,rgba(255,130,0,0.14),transparent_65%)]" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-[20%] z-[1]" aria-hidden="true">
        {children}
      </div>
      <nav aria-label="Our services" className="absolute inset-0">
        <ul>
          {list.map((s, i) => (
            <li key={s.label} ref={(n) => (items.current[i] = n)} className="absolute left-1/2 top-1/2 will-change-transform">
              <Link to={s.to} className="group flex w-24 flex-col items-center gap-2 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-paper/15 bg-surface text-amber transition duration-200 group-hover:scale-125 group-hover:border-amber group-focus-visible:scale-125">
                  <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d={s.d} />
                  </svg>
                </span>
                <span className="text-[11px] font-medium leading-tight text-paper">{s.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
