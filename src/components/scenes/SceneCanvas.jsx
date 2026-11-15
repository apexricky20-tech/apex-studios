import { useEffect, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { MathUtils } from 'three'
import { PLACE } from '../../lib/scene3d'
import { SCENES } from './registry'

// One canvas is shared by every page. Only the scene for the current page is mounted.
// Frames are drawn on demand at a capped rate (30 on phones and older devices, 60 otherwise),
// and nothing is drawn while the tab is hidden or when the current page has no scene.
function Driver({ fps, active }) {
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => {
    if (!active) return undefined
    let raf = 0
    let last = 0
    const loop = (now) => {
      raf = requestAnimationFrame(loop)
      if (now - last >= 1000 / fps - 2) {
        last = now
        invalidate()
      }
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [active, fps, invalidate])
  return null
}

// Places the model off to the side on wide screens, low in the corner on phones,
// and lets it turn gently with the scroll position and the mouse.
function Rig({ children, place = {} }) {
  const group = useRef(null)
  const viewport = useThree((s) => s.viewport)
  const wide = viewport.aspect > 1.1
  const scale = (wide ? (viewport.height / 5.1) * 0.9 : viewport.width / 5.6) * (place.s ?? 1)
  const x = wide ? viewport.width * 0.27 + (place.dx ?? 0) : viewport.width * 0.12
  const y = wide ? (place.dy ?? 0) : -viewport.height * 0.2

  useFrame((state, delta) => {
    const g = group.current
    if (!g) return
    const max = document.documentElement.scrollHeight - window.innerHeight
    const progress = max > 0 ? Math.min(1, window.scrollY / max) : 0
    g.rotation.y = MathUtils.damp(g.rotation.y, -0.35 + progress * 1.1 + state.pointer.x * 0.25, 3, delta)
    g.rotation.x = MathUtils.damp(g.rotation.x, 0.12 - state.pointer.y * 0.12, 3, delta)
    g.position.y = MathUtils.damp(g.position.y, y + progress * 0.5, 3, delta)
  })

  return (
    <group ref={group} position={[x, y, 0]} scale={scale}>
      {children}
    </group>
  )
}

export default function SceneCanvas({ scene, tier }) {
  const Scene = scene ? SCENES[scene] : null
  const full = tier === 2
  return (
    <Canvas
      camera={{ position: [0, 0, 7], fov: 40 }}
      dpr={full ? [1, 1.5] : 1}
      frameloop="demand"
      eventSource={full ? document.documentElement : undefined}
      eventPrefix="client"
      gl={{ alpha: true, antialias: full, stencil: false, powerPreference: 'low-power' }}
    >
      <Driver fps={full ? 60 : 30} active={Boolean(Scene)} />
      {Scene && (
        <Rig key={scene} place={PLACE[scene]}>
          <Scene />
        </Rig>
      )}
    </Canvas>
  )
}
