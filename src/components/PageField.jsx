import { Component, lazy, Suspense, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { FX } from '../lib/fx'
import { fieldFor } from '../lib/fields'
import { sceneTier } from '../lib/scene3d'

// The full-page background field of each inner page (kinds and tuning: lib/fields.js). Same rules as
// the 3D models (PageScene.jsx): its code is fetched only once the page has settled, never for reduced
// motion, data saver or a slow connection, and a failure just means no field. It sits behind the model.
const FieldCanvas = lazy(() => import('./fields/FieldCanvas'))

class Boundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

export default function PageField() {
  const { pathname } = useLocation()
  const wanted = FX.fields ? fieldFor(pathname) : null
  const [tier] = useState(sceneTier)
  const [armed, setArmed] = useState(false)
  const [shown, setShown] = useState(null)
  const wantedId = wanted?.id ?? null

  useEffect(() => {
    if (!tier || !wantedId || armed) return undefined
    let idle = 0
    const go = () => setArmed(true)
    const timer = setTimeout(() => {
      if ('requestIdleCallback' in window) idle = requestIdleCallback(go, { timeout: 2000 })
      else go()
    }, 900)
    return () => {
      clearTimeout(timer)
      if (idle) cancelIdleCallback(idle)
    }
  }, [tier, wantedId, armed])

  // Fade the old field out, swap, fade the new one in.
  useEffect(() => {
    if (!tier || wantedId === shown) return undefined
    const swap = setTimeout(() => setShown(wantedId), shown ? 320 : 0)
    return () => clearTimeout(swap)
  }, [tier, wantedId, shown])

  if (!tier || !armed) return null

  const field = shown && wanted && wanted.id === shown ? wanted : null
  const { id, dim = 1, ...cfg } = field ?? {}
  const base = window.innerWidth < 768 ? 0.5 : 0.75
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 transition-opacity duration-500"
      style={{ opacity: field ? base * dim : 0 }}
    >
      <Boundary>
        <Suspense fallback={null}>
          {shown && field && <FieldCanvas key={id} mode={cfg.mode} cfg={cfg} seed={id} tier={tier} />}
        </Suspense>
      </Boundary>
    </div>
  )
}
