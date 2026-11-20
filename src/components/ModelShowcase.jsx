import { Component, lazy, Suspense, useEffect, useRef, useState } from 'react'
import { sceneTier } from '../lib/scene3d'
import { Link } from 'react-router-dom'

// "This is what you get": a model from page.model (see src/data/threeDCreation.js) the visitor can turn.
// Nothing is downloaded until it is near the screen, and visitors on reduced motion, data saver or a slow
// link see the poster picture instead.
const ModelViewer = lazy(() => import('./ModelViewer'))

class Boundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

export default function ModelShowcase({ model }) {
  const ref = useRef(null)
  const [near, setNear] = useState(false)
  const [on, setOn] = useState(false)
  const [tier] = useState(sceneTier)

  useEffect(() => {
    const el = ref.current
    const io = new IntersectionObserver(([e]) => setNear(e.isIntersecting), { rootMargin: '200px' })
    io.observe(el)
    const warm = new IntersectionObserver(([e]) => e.isIntersecting && (setOn(true), warm.disconnect()), { rootMargin: '600px' })
    warm.observe(el)
    return () => {
      io.disconnect()
      warm.disconnect()
    }
  }, [])

  const poster = model.poster ? <img src={model.poster} alt={model.alt} loading="lazy" decoding="async" className="h-full w-full object-contain" /> : null
  return (
    <section ref={ref} aria-labelledby="model-title" className="mt-20 grid items-center gap-8 rounded-3xl border border-paper/10 bg-surface p-6 md:grid-cols-[1.2fr_1fr] md:p-12">
      <div className="aspect-square w-full overflow-hidden rounded-2xl bg-ink md:aspect-[4/3]">
        {tier && on ? (
          <Boundary fallback={poster}>
            <Suspense fallback={poster}>
              <ModelViewer src={model.src} alt={model.alt} visible={near} />
            </Suspense>
          </Boundary>
        ) : (
          poster
        )}
      </div>
      <div>
        <p className="text-sm uppercase tracking-widest text-amber">Try it</p>
        <h2 id="model-title" className="mt-4 text-3xl md:text-4xl">
          {model.title || 'Turn it with your finger'}
        </h2>
        <p className="mt-4 text-muted">
          {model.caption || 'This is a live 3D model, not a video. On your website, guests can turn a room, a dish or a product themselves before they book or buy.'}
        </p>
        <Link to="/free-check" className="mt-6 inline-block border-b border-paper pb-0.5 text-sm font-semibold transition-colors hover:border-amber hover:text-amber">
          Want this on your site? Start with a free digital check &rsaquo;
        </Link>
      </div>
    </section>
  )
}
