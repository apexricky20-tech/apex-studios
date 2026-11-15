import { Component, lazy, Suspense, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { PLACE, sceneFor, sceneTier } from '../lib/scene3d'

// The 3D code is its own file. It is only downloaded once the page has finished loading and the
// browser is idle, and never for visitors on reduced motion, data saver or a very slow connection.
const SceneCanvas = lazy(() => import('./scenes/SceneCanvas'))

class Boundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

export default function PageScene() {
  const { pathname } = useLocation()
  const wanted = sceneFor(pathname)
  const [tier] = useState(sceneTier)
  const [armed, setArmed] = useState(false)
  const [shown, setShown] = useState(null)

  // Wait for the page to settle before fetching any 3D code.
  useEffect(() => {
    if (!tier || !wanted || armed) return undefined
    let idle = 0
    const go = () => setArmed(true)
    const timer = setTimeout(() => {
      if ('requestIdleCallback' in window) idle = requestIdleCallback(go, { timeout: 2000 })
      else go()
    }, 800)
    return () => {
      clearTimeout(timer)
      if (idle) cancelIdleCallback(idle)
    }
  }, [tier, wanted, armed])

  // Fade the old scene out, then swap, then fade the new one in.
  useEffect(() => {
    if (!tier || wanted === shown) return undefined
    const swap = setTimeout(() => setShown(wanted), shown ? 320 : 0)
    return () => clearTimeout(swap)
  }, [tier, wanted, shown])

  if (!tier || !armed) return null

  const on = wanted && wanted === shown
  const base = window.innerWidth < 768 ? 0.6 : 0.9
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 transition-opacity duration-500"
      style={{ opacity: on ? base * (PLACE[wanted]?.dim ?? 1) : 0 }}
    >
      <Boundary>
        <Suspense fallback={null}>
          <SceneCanvas scene={shown} tier={tier} />
        </Suspense>
      </Boundary>
    </div>
  )
}
