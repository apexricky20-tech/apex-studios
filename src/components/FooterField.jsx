import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { sceneTier } from '../lib/scene3d'

// The footer's own scene: a swinging brass pendant lamp, a cone of light with dust, and rising embers
// (kind "lamp" in fields/modes.js). Nothing is fetched or drawn until the footer is about to come into view.
const FieldCanvas = lazy(() => import('./fields/FieldCanvas'))

export default function FooterField() {
  const [tier] = useState(sceneTier)
  const [near, setNear] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!tier || !ref.current) return undefined
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setNear(true)
          io.disconnect()
        }
      },
      { rootMargin: '400px' },
    )
    io.observe(ref.current)
    return () => io.disconnect()
  }, [tier])

  if (!tier) return null
  return (
    <div ref={ref} aria-hidden="true" className="footer-field">
      {near && (
        <Suspense fallback={null}>
          <FieldCanvas mode="lamp" seed="footer" tier={tier} local className="footer-field__canvas" />
        </Suspense>
      )}
    </div>
  )
}
