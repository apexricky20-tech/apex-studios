import { useEffect, useRef, useState } from 'react'
import { calm } from '../lib/fx'

// Two optional extras for a case study. Each one shows only when the project has the files for it
// (see the comments at the top of src/data/projects.js), so a project without them looks exactly as before.

const slowLink = () => {
  const c = navigator.connection
  return Boolean(c?.saveData) || /^(slow-2g|2g|3g)$/.test(c?.effectiveType || '')
}

// A short, silent, looping screen recording. It downloads only when it is near the screen, plays only while
// it is on screen, and never plays by itself for visitors on reduced motion, data saver or a slow link:
// they get the poster picture and a play button instead.
function Clip({ video, title }) {
  const ref = useRef(null)
  const [lite] = useState(() => calm() || slowLink())
  const [armed, setArmed] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const near = new IntersectionObserver(([e]) => e.isIntersecting && (setArmed(true), near.disconnect()), { rootMargin: '300px' })
    near.observe(el)
    let seen
    if (!lite) {
      seen = new IntersectionObserver(
        ([e]) => {
          if (e.isIntersecting) el.play().catch(() => {})
          else el.pause()
        },
        { threshold: 0.4 },
      )
      seen.observe(el)
    }
    return () => {
      near.disconnect()
      seen?.disconnect()
    }
  }, [lite])

  return (
    <video
      ref={ref}
      muted
      loop
      playsInline
      controls={lite}
      preload={lite ? 'none' : 'metadata'}
      poster={video.poster}
      aria-label={video.alt || `${title} on a phone`}
      className="h-full w-full object-cover"
    >
      {(armed || lite) && video.webm && <source src={video.webm} type="video/webm" />}
      {(armed || lite) && video.src && <source src={video.src} type="video/mp4" />}
    </video>
  )
}

// Drag (or use the arrow keys) to wipe between the old site and the new one. The slider is a real
// range input laid over the pictures, so touch, mouse and keyboard all work and screen readers announce it.
function Compare({ before, after, title }) {
  const [pos, setPos] = useState(50)
  return (
    <div className="relative aspect-[16/10] select-none overflow-hidden rounded-2xl border border-paper/10 bg-surface focus-within:ring-2 focus-within:ring-amber">
      <img src={before.image} alt={before.alt || `${title} before`} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
      <img
        src={after.image}
        alt={after.alt || `${title} after`}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover"
        style={{ clipPath: `inset(0 0 0 ${pos}%)` }}
      />
      <span className="pointer-events-none absolute left-4 top-4 rounded-full bg-ink/80 px-3 py-1 text-xs font-semibold uppercase tracking-widest">Before</span>
      <span className="pointer-events-none absolute right-4 top-4 rounded-full bg-paper px-3 py-1 text-xs font-semibold uppercase tracking-widest text-ink">After</span>
      <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-amber" style={{ left: `${pos}%` }}>
        <span className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-amber text-ink shadow-lg" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 6l-6 6 6 6M15 6l6 6-6 6" />
          </svg>
        </span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        step="1"
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        aria-label={`Drag to compare ${title} before and after`}
        className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
        style={{ touchAction: 'pan-y' }}
      />
    </div>
  )
}

export default function CaseMedia({ project }) {
  const { video, before } = project
  if (!video && !before) return null
  return (
    <>
      {video && (video.src || video.webm) && (
        <section className="mt-16" aria-labelledby="clip-title">
          <h2 id="clip-title" className="text-3xl md:text-5xl">
            See it working
          </h2>
          <div className="mx-auto mt-8 aspect-[9/16] max-h-[78svh] w-auto max-w-[min(100%,420px)] overflow-hidden rounded-[2rem] border border-paper/15 bg-surface">
            <Clip video={video} title={project.title} />
          </div>
        </section>
      )}
      {before?.image && (
        <section className="mt-16" aria-labelledby="compare-title">
          <h2 id="compare-title" className="text-3xl md:text-5xl">
            Before and after
          </h2>
          <p className="mt-4 text-muted">Drag the handle to compare the old site with the new one.</p>
          <div className="mt-8">
            <Compare before={before} after={{ image: project.image, alt: `${project.title} website after` }} title={project.title} />
          </div>
        </section>
      )}
    </>
  )
}
