import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { MathUtils } from 'three'

// small seeded random so the particle layout is the same every render
function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function Globe({ progress, count }) {
  const group = useRef(null)

  const { positions, colors } = useMemo(() => {
    const rand = rng(7)
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    const golden = Math.PI * (3 - Math.sqrt(5))
    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2
      const r = Math.sqrt(1 - y * y)
      const theta = golden * i
      const x = Math.cos(theta) * r
      const z = Math.sin(theta) * r
      // the right side breaks apart into drifting amber particles
      const dissolve = Math.max(0, x) ** 1.5 * rand() * 0.55
      const s = 1 + dissolve
      pos.set([x * s, y * s, z * s], i * 3)
      col.set(dissolve > 0.18 ? [0.96, 0.65, 0.14] : [0.96, 0.95, 0.92], i * 3)
    }
    return { positions: pos, colors: col }
  }, [count])

  useFrame((state, delta) => {
    const g = group.current
    if (!g) return
    const p = progress.current
    g.rotation.y = MathUtils.damp(g.rotation.y, p * Math.PI * 2.2 + state.pointer.x * 0.5, 4, delta)
    g.rotation.x = MathUtils.damp(g.rotation.x, -0.25 + p * 0.5 - state.pointer.y * 0.3, 4, delta)
    g.scale.setScalar(MathUtils.damp(g.scale.x, 0.8 + p * 0.35, 4, delta))
  })

  return (
    <group ref={group}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.018} vertexColors sizeAttenuation transparent opacity={0.9} depthWrite={false} />
      </points>
      <mesh>
        <sphereGeometry args={[1, 40, 28, -Math.PI / 2, Math.PI]} />
        <meshBasicMaterial wireframe color="#f4f1ea" transparent opacity={0.18} />
      </mesh>
    </group>
  )
}

export default function Sphere3D({ progress, visible }) {
  const small = typeof window !== 'undefined' && window.innerWidth < 768
  return (
    <Canvas
      camera={{ position: [0, 0, 3.4], fov: 45 }}
      dpr={[1, 1.5]}
      frameloop={visible ? 'always' : 'never'}
      gl={{ alpha: true, antialias: true }}
    >
      <Globe progress={progress} count={small ? 2200 : 4200} />
    </Canvas>
  )
}
