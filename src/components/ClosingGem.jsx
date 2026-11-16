import { Component, lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { FX } from '../lib/fx'
import ServiceOrbit from './ServiceOrbit'

const Gem3D = lazy(() => import('./Gem3D'))

// A light, flat blob for phones, slow connections and reduced-motion visitors. Same neutral
// chrome-and-amber palette as the 3D version, no filters, one gradient.
function GemSvg() {
  return (
    <svg viewBox="0 0 200 200" className="gem-float mx-auto h-full w-full max-w-[320px]" aria-hidden="true">
      <defs>
        <radialGradient id="blob-fill" cx="36%" cy="30%" r="80%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.45" stopColor="#9a9a9a" />
          <stop offset="1" stopColor="#141414" />
        </radialGradient>
      </defs>
      <path
        d="M100 30C130 24 164 48 166 82C168 112 150 150 112 166C78 180 40 160 32 122C24 88 44 52 70 40C80 35 90 32 100 30Z"
        fill="url(#blob-fill)"
        stroke="#ff8200"
        strokeOpacity="0.45"
        strokeWidth="1"
      />
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

// Phones get the 3D blob too. The flat SVG stays for the cases where WebGL would hurt: reduced motion,
// data saver, a 2G link, a very low-memory device, or no working WebGL at all.
function canRun3d() {
  if (!FX.gem) return false
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  const c = navigator.connection
  if (c?.saveData || /(^|-)2g$/.test(c?.effectiveType ?? '')) return false
  if (navigator.deviceMemory && navigator.deviceMemory <= 2) return false
  try {
    const gl = document.createElement('canvas').getContext('webgl2') || document.createElement('canvas').getContext('webgl')
    if (!gl) return false
    gl.getExtension('WEBGL_lose_context')?.loseContext() // hand the context back, phones only allow a few
    return true
  } catch {
    return false
  }
}

export default function ClosingGem() {
  const ref = useRef(null)
  const [near, setNear] = useState(false)
  const [use3d] = useState(canRun3d)

  useEffect(() => {
    const io = new IntersectionObserver(([entry]) => setNear(entry.isIntersecting), { rootMargin: '200px' })
    io.observe(ref.current)
    // Start fetching the 3D chunk a few screens early so it is ready (no flat-blob flash) on a phone.
    let warm
    if (use3d) {
      warm = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return
          import('./Gem3D')
          warm.disconnect()
        },
        { rootMargin: '1500px 0px' },
      )
      warm.observe(ref.current)
    }
    return () => {
      io.disconnect()
      warm?.disconnect()
    }
  }, [use3d])

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
        <ServiceOrbit running={near} bloomOn={use3d}>
          {use3d && near ? (
            <Boundary fallback={<GemSvg />}>
              <Suspense fallback={<GemSvg />}>
                <Gem3D visible={near} />
              </Suspense>
            </Boundary>
          ) : (
            <GemSvg />
          )}
        </ServiceOrbit>
      </div>
    </section>
  )
}
