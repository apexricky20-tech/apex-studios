import { Component, lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { FX } from '../lib/fx'

const Gem3D = lazy(() => import('./Gem3D'))

// A light, flat diamond for phones, slow connections and reduced-motion visitors.
function GemSvg() {
  const facets = [
    ['30,80 60,40 65,80', 0.2],
    ['60,40 100,40 65,80', 0.1],
    ['100,40 65,80 100,80', 0.26],
    ['100,40 135,80 100,80', 0.12],
    ['100,40 140,40 135,80', 0.22],
    ['140,40 170,80 135,80', 0.08],
    ['30,80 65,80 100,175', 0.12],
    ['65,80 100,80 100,175', 0.24],
    ['100,80 135,80 100,175', 0.1],
    ['135,80 170,80 100,175', 0.18],
  ]
  return (
    <svg viewBox="0 0 200 200" className="gem-float mx-auto h-full w-full max-w-[320px]" aria-hidden="true">
      {facets.map(([points, o]) => (
        <polygon key={points} points={points} fill="#ffffff" fillOpacity={o} stroke="#ff8200" strokeOpacity="0.55" strokeWidth="1" strokeLinejoin="round" />
      ))}
    </svg>
  )
}

class Boundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

export default function ClosingGem() {
  const ref = useRef(null)
  const [near, setNear] = useState(false)
  const [use3d] = useState(
    () =>
      FX.gem &&
      window.matchMedia('(min-width: 768px)').matches &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
      !navigator.connection?.saveData,
  )

  useEffect(() => {
    const io = new IntersectionObserver(([entry]) => setNear(entry.isIntersecting), { rootMargin: '200px' })
    io.observe(ref.current)
    return () => io.disconnect()
  }, [])

  return (
    <section ref={ref} aria-labelledby="closing-title" className="relative overflow-hidden px-gutter py-32 md:py-44">
      <div className="mx-auto grid max-w-[1240px] items-center gap-12 lg:grid-cols-2">
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-amber">Ready when you are</p>
          <h2 id="closing-title" className="mt-6 text-[clamp(2.75rem,7vw,6rem)]">
            Let&apos;s make your place shine
          </h2>
          <p className="mt-6 max-w-lg text-lg text-muted">
            Tell us about your hotel, lodge or restaurant. We will reply with the next step.
          </p>
          <Link
            to="/contact"
            className="mt-10 inline-block rounded-full bg-paper px-9 py-4 text-sm font-semibold text-ink transition-colors hover:bg-amber"
          >
            Start a project
          </Link>
        </div>
        <div role="img" aria-label="A slowly turning faceted diamond" className="mx-auto aspect-square w-full max-w-[460px]">
          {use3d && near ? (
            <Boundary fallback={<GemSvg />}>
              <Suspense fallback={<GemSvg />}>
                <Gem3D visible={near} />
              </Suspense>
            </Boundary>
          ) : (
            <GemSvg />
          )}
        </div>
      </div>
    </section>
  )
}
