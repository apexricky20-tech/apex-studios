import { Component, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { FX, fine } from '../lib/fx'
import { stageTier, startStage } from '../lib/stage'

// The choreography layer: blinds between pages, embers, the 'Step inside' bubble.
// The motion itself lives in src/stage.css and src/lib/stage.js. Everything here is decoration:
// it is hidden from screen readers, never takes a click, and if it ever throws, the boundary below
// removes it and the site carries on.
const SLATS = Array.from({ length: 8 }, (_, i) => i)

function StageInner() {
  const { pathname } = useLocation()
  const [tier] = useState(stageTier)
  const shutter = useRef(null)
  const embers = useRef(null)
  const cursor = useRef(null)
  const engine = useRef(null)
  const prev = useRef(pathname)

  // Set before the first paint so the CSS for headings and cards is in place before anything reveals.
  useLayoutEffect(() => {
    if (!tier) return undefined
    const root = document.documentElement
    root.setAttribute('data-stage-tier', String(tier))
    return () => root.removeAttribute('data-stage-tier')
  }, [tier])

  useEffect(() => {
    if (!tier) return undefined
    engine.current = startStage({ tier, embers: embers.current, cursor: cursor.current })
    return () => {
      engine.current?.destroy()
      engine.current = null
    }
  }, [tier])

  // Blinds lift open on every page change (not on the first load).
  useLayoutEffect(() => {
    if (prev.current === pathname) return undefined
    prev.current = pathname
    engine.current?.rescan()
    const el = shutter.current
    if (!tier || !el || document.documentElement.hasAttribute('data-stage-lite')) return undefined
    el.classList.remove('is-on')
    void el.offsetWidth // restart the animation if a previous one is still running
    el.classList.add('is-on')
    const done = setTimeout(() => el.classList.remove('is-on'), 1300)
    return () => clearTimeout(done)
  }, [pathname, tier])

  if (!tier) return null
  return (
    <>
      {FX.shutter && (
        <div ref={shutter} className="stage-shutter" aria-hidden="true">
          {SLATS.map((i) => (
            <span key={i} className="stage-slat" style={{ '--i': i }} />
          ))}
        </div>
      )}
      {tier === 2 && FX.embers && <canvas ref={embers} className="stage-embers" aria-hidden="true" />}
      {tier === 2 && FX.cursorLabel && fine() && (
        <div ref={cursor} className="stage-cursor" aria-hidden="true">
          <span />
        </div>
      )}
    </>
  )
}

class Boundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

export default function Stage() {
  return (
    <Boundary>
      <StageInner />
    </Boundary>
  )
}
