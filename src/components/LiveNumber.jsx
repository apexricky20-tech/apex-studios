import { useLayoutEffect, useRef } from 'react'
import { calm } from '../lib/fx'
import { formatCount, splitNumbers } from '../lib/count'

// A result line whose figures count up from zero, once, when the card scrolls into view.
// The real text is always in the page (screen readers, print, search, reduced motion, no script):
// while it counts, a decorative copy is laid over it, so the width never changes and nothing shifts.
export default function LiveNumber({ text }) {
  const root = useRef(null)
  const parts = splitNumbers(text)

  useLayoutEffect(() => {
    const el = root.current
    if (!el || calm() || !('IntersectionObserver' in window)) return undefined
    const slots = [...el.querySelectorAll('.live-num')]
    if (!slots.length) return undefined
    const show = (k) =>
      slots.forEach((s) => {
        s.lastElementChild.textContent = formatCount(Number(s.dataset.to) * k, { decimals: Number(s.dataset.d), comma: s.dataset.c === '1' })
      })
    let raf = 0
    slots.forEach((s) => s.setAttribute('data-counting', ''))
    show(0)
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        io.disconnect()
        const t0 = performance.now()
        const tick = (t) => {
          const p = Math.min(1, (t - t0) / 1400)
          show(1 - (1 - p) ** 4)
          if (p < 1) raf = requestAnimationFrame(tick)
          else slots.forEach((s) => s.removeAttribute('data-counting'))
        }
        raf = requestAnimationFrame(tick)
      },
      { threshold: 0.6 },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
      slots.forEach((s) => s.removeAttribute('data-counting'))
    }
  }, [text])

  return (
    <span ref={root}>
      {parts.map((p, i) =>
        p.to === undefined ? (
          p.text
        ) : (
          <span key={i} className="live-num" data-to={p.to} data-d={p.decimals} data-c={p.comma ? '1' : '0'}>
            <span className="live-num__base">{p.text}</span>
            <span className="live-num__tick" aria-hidden="true" />
          </span>
        ),
      )}
    </span>
  )
}
