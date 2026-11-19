import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { MathUtils } from 'three'
import { FORMS } from '../lib/forms'

// small seeded random so the particle layout is the same every render
function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Each pillar on "Why choose us" has its own formation. Same 4,200 particles every time: only where
// they sit and which ones glow amber changes. Index 0 is the resting globe (nothing open); 1 to 4 follow
// the pillars in order, so the picture means the same thing as the words beside it.
//   1 Complete Experiences   one unbroken sphere, a few amber points threaded through it
//   2 Crafted, Not Templated one-of-a-kind: the sphere shaped by uneven swells, not a stamped-out ball
//   3 Intentional Process    four orbits, each with a bright arc for how far along you are (the four steps of a build)
//   4 Built to Resonate      the sphere ringed with standing waves, amber on the crests

const PAPER = [0.96, 0.95, 0.92]
const AMBER_RGB = [1, 0.223, 0] // the brand amber #ff8200 in linear colour (raw buffer values skip the sRGB conversion)

function formations(count) {
  const golden = Math.PI * (3 - Math.sqrt(5))
  const sets = FORMS.map(() => ({ pos: new Float32Array(count * 3), col: new Float32Array(count * 3) }))
  const put = (k, i, x, y, z, amber) => {
    sets[k].pos.set([x, y, z], i * 3)
    sets[k].col.set(amber ? AMBER_RGB : PAPER, i * 3)
  }
  const rand = rng(7)
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1)
    const y = 1 - t * 2
    const r = Math.sqrt(1 - y * y)
    const th = golden * i
    const x = Math.cos(th) * r
    const z = Math.sin(th) * r

    // 0: resting globe, the right side breaks apart into amber particles
    const dissolve = Math.max(0, x) ** 1.5 * rand() * 0.55
    const s = 1 + dissolve
    put(0, i, x * s, y * s, z * s, dissolve > 0.18)

    // 1: one whole sphere, every 9th point amber
    put(1, i, x, y, z, i % 9 === 0)

    // 2: one-of-a-kind: the same sphere pushed out and in by smooth, uneven swells. No two views alike,
    // the opposite of a perfect stamped-out ball. Amber sits on the highest swells.
    const bump =
      0.55 * Math.sin(x * 2.1 + y * 1.3 + 0.6) + 0.3 * Math.sin(y * 3.3 - z * 2.2 + 1.9) + 0.25 * Math.sin(z * 3.9 + x * 2.7)
    const rc = 1 + 0.2 * bump
    put(2, i, x * rc, y * rc, z * rc, bump > 0.7)

    // 3: four orbits, tilted differently, one amber marker each
    const ring = i % 4
    const along = (Math.floor(i / 4) / (count / 4)) * Math.PI * 2
    const rad = 0.5 + ring * 0.2
    const tilt = 0.5 + ring * 0.35
    const ox = Math.cos(along) * rad
    const oy = Math.sin(along) * rad
    put(3, i, ox, oy * Math.cos(tilt), oy * Math.sin(tilt), Math.floor(i / 4) < count * 0.012) // a bright arc on each orbit: how far along you are

    // 4: latitude waves on the sphere, amber where the surface is highest
    const wave = Math.sin(y * Math.PI * 7)
    const rw = 1 + 0.13 * wave
    put(4, i, x * rw, y * rw, z * rw, wave > 0.92)
  }
  return sets
}

function Globe({ progress, count, form }) {
  const group = useRef(null)
  const geom = useRef(null)
  const done = useRef({ form: -1, settled: false }) // lets the per-particle loop sleep once it has arrived
  const sets = useMemo(() => formations(count), [count])
  // The geometry gets its own copy of the starting formation; useFrame then edits that copy in place.
  const start = useMemo(() => ({ pos: Float32Array.from(sets[1].pos), col: Float32Array.from(sets[1].col) }), [sets])

  useFrame((state, delta) => {
    const g = group.current
    if (!g) return
    const p = progress.current
    g.rotation.y = MathUtils.damp(g.rotation.y, p * Math.PI * 2.2 + state.pointer.x * 0.5, 4, delta)
    g.rotation.x = MathUtils.damp(g.rotation.x, -0.25 + p * 0.5 - state.pointer.y * 0.3, 4, delta)
    g.scale.setScalar(MathUtils.damp(g.scale.x, 0.8 + p * 0.35, 4, delta))

    // Glide every particle towards its place in the chosen formation (exponential smoothing, so it
    // settles without any timeline to manage). The GPU buffers are only re-uploaded while moving.
    const attrs = geom.current?.attributes
    if (!attrs) return
    const pos = attrs.position.array
    const col = attrs.color.array
    if (done.current.settled && done.current.form === form.current) return
    const target = sets[Math.min(Math.max(form.current, 0), sets.length - 1)]
    const k = 1 - Math.exp(-3.2 * Math.min(delta, 0.05))
    let moving = false
    for (let n = 0; n < pos.length; n++) {
      const dp = target.pos[n] - pos[n]
      const dc = target.col[n] - col[n]
      if (dp > 0.0004 || dp < -0.0004 || dc > 0.002 || dc < -0.002) moving = true
      pos[n] += dp * k
      col[n] += dc * k
    }
    done.current = { form: form.current, settled: !moving }
    if (moving) {
      attrs.position.needsUpdate = true
      attrs.color.needsUpdate = true
    }
  })

  return (
    <group ref={group}>
      <points>
        <bufferGeometry ref={geom}>
          <bufferAttribute attach="attributes-position" args={[start.pos, 3]} />
          <bufferAttribute attach="attributes-color" args={[start.col, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.018} vertexColors sizeAttenuation transparent opacity={0.9} depthWrite={false} />
      </points>
      <mesh>
        <sphereGeometry args={[1, 40, 28, -Math.PI / 2, Math.PI]} />
        <meshBasicMaterial wireframe color="#ffffff" transparent opacity={0.18} />
      </mesh>
    </group>
  )
}

export default function Sphere3D({ progress, visible, form }) {
  const small = typeof window !== 'undefined' && window.innerWidth < 768
  return (
    <Canvas
      camera={{ position: [0, 0, 3.4], fov: 45 }}
      dpr={[1, 1.5]}
      frameloop={visible ? 'always' : 'never'}
      gl={{ alpha: true, antialias: true }}
    >
      <Globe progress={progress} count={small ? 2200 : 4200} form={form} />
    </Canvas>
  )
}
