import { lazy, Suspense, useEffect, useState } from 'react'
import { sceneTier } from '../lib/scene3d'

// The field behind the home page's sections: a faint grid, three slow amber lights and, for visitors whose
// device and settings allow it, a turning 3D network (Constellation.jsx). The grid and lights are CSS (see
// "ambient field" in index.css). The network is its own small file, fetched only after the page has settled,
// and never for reduced motion, data saver or a very slow connection. The field is one viewport tall and sticks
// to the screen, so the sections scroll across it and it never grows with the page.
const Constellation = lazy(() => import('./Constellation'))

export default function AmbientField() {
  const [tier] = useState(sceneTier)
  const [armed, setArmed] = useState(false)

  useEffect(() => {
    if (!tier) return undefined
    let idle = 0
    const go = () => setArmed(true)
    const timer = setTimeout(() => {
      if ('requestIdleCallback' in window) idle = requestIdleCallback(go, { timeout: 2000 })
      else go()
    }, 700)
    return () => {
      clearTimeout(timer)
      if (idle) cancelIdleCallback(idle)
    }
  }, [tier])

  return (
    <div className="ambient-field" aria-hidden="true">
      <i />
      <i />
      <i />
      {tier > 0 && armed && (
        <Suspense fallback={null}>
          <Constellation tier={tier} />
        </Suspense>
      )}
    </div>
  )
}
