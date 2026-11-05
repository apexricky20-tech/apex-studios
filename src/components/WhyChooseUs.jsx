import { Component, lazy, Suspense, useEffect, useRef, useState } from 'react'

const Sphere3D = lazy(() => import('./Sphere3D'))

const values = [
  {
    title: 'Complete Experiences',
    text: 'Design, development and automation working together, so your website, your ordering and your enquiries feel like one experience instead of a patchwork of tools.',
  },
  {
    title: 'Crafted, Not Templated',
    text: 'Every site is built around your place and your guests. No recycled themes and no bloat that slows a phone down.',
  },
  {
    title: 'Intentional Process',
    text: 'A clear path from first call to launch: what we are building, why, and when it will be done, with no surprises along the way.',
  },
  {
    title: 'Built to Resonate',
    text: 'Design and words that sound like you and speak to the guests you want, so visitors feel something before they ever arrive.',
  },
]

class SafeCanvas extends Component {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

export default function WhyChooseUs() {
  const [open, setOpen] = useState(0)
  const [near, setNear] = useState(false)
  const [reduce] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const sectionRef = useRef(null)
  const progress = useRef(0)

  useEffect(() => {
    const el = sectionRef.current
    const io = new IntersectionObserver(([entry]) => setNear(entry.isIntersecting), {
      rootMargin: '200px',
    })
    io.observe(el)

    let raf = 0
    const update = () => {
      const r = el.getBoundingClientRect()
      const vh = window.innerHeight
      progress.current = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)))
    }
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      io.disconnect()
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <section ref={sectionRef} className="relative overflow-hidden px-gutter py-24 md:py-40">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[60vh] bg-[radial-gradient(ellipse_at_50%_0%,rgba(255, 130, 0,0.12),transparent_65%)]"
      />
      <h2 className="relative text-center text-5xl font-bold md:text-8xl">Why choose us?</h2>

      <div className="relative mx-auto mt-16 grid max-w-[1400px] items-center gap-12 md:mt-24 lg:grid-cols-2">
        <ul>
          {values.map((v, i) => {
            const isOpen = open === i
            return (
              <li key={v.title} className="border-t border-paper/15 last:border-b">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  aria-expanded={isOpen}
                  className="group flex w-full items-center justify-between gap-6 py-6 text-left text-2xl font-medium transition-colors hover:text-amber md:text-4xl"
                >
                  {v.title}
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className={`h-6 w-6 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`}
                    aria-hidden="true"
                  >
                    <path d="M5 12h14m-6-6 6 6-6 6" />
                  </svg>
                </button>
                <div
                  className={`grid transition-[grid-template-rows] duration-300 ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
                >
                  <div className="overflow-hidden">
                    <p className="max-w-lg pb-6 pr-8 text-paper/70">{v.text}</p>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>

        <div
          role="img"
          aria-label="Animated 3D sphere"
          className="mx-auto aspect-square w-full max-w-[560px]"
        >
          {near && !reduce && (
            <SafeCanvas>
              <Suspense fallback={null}>
                <Sphere3D progress={progress} visible={near} />
              </Suspense>
            </SafeCanvas>
          )}
        </div>
      </div>
    </section>
  )
}
