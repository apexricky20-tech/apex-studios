import { useEffect, useRef, useState } from 'react'

// The four PageSpeed scores as rings that fill when the card scrolls into view.
// Decorative only (aria-hidden): the same numbers are in the card's text. Resting look is in index.css,
// the drawing-in motion is in stage.css (section 13).
export default function ScoreRings({ scores }) {
  const ref = useRef(null)
  const [seen, setSeen] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        setSeen(true)
        io.disconnect()
      },
      { threshold: 0.5 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={ref} className="score-rings" aria-hidden="true" data-seen={seen ? '' : undefined}>
      {scores.map((s, i) => (
        <div key={s.label} className="score-ring" style={{ '--v': s.value / 100, '--i': i }}>
          <div className="score-dial">
            <svg viewBox="0 0 44 44">
              <circle className="score-track" cx="22" cy="22" r="19" />
              <circle className="score-arc" cx="22" cy="22" r="19" pathLength="1" />
            </svg>
            <span className="score-num">{s.value}</span>
          </div>
          <span className="score-label">{s.label}</span>
        </div>
      ))}
    </div>
  )
}
