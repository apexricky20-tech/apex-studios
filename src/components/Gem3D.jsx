import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { EdgesGeometry, LatheGeometry, MathUtils, PMREMGenerator, Vector2 } from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

// A built-in studio environment gives the metal something to reflect, with no files to download.
function Studio() {
  const gl = useThree((state) => state.gl)
  const texture = useMemo(() => {
    const room = new RoomEnvironment()
    const pmrem = new PMREMGenerator(gl)
    const target = pmrem.fromScene(room, 0.04)
    room.dispose()
    pmrem.dispose()
    return target.texture
  }, [gl])
  useEffect(() => () => texture.dispose(), [texture])
  return <primitive object={texture} attach="environment" />
}

function Gem() {
  const group = useRef(null)

  // A simple brilliant cut: culet, pavilion, girdle, crown and a flat table, eight sides.
  const geometry = useMemo(() => {
    const profile = [
      [0, -1],
      [0.55, -0.08],
      [0.78, 0],
      [0.74, 0.1],
      [0.4, 0.4],
      [0, 0.4],
    ].map(([x, y]) => new Vector2(x, y))
    return new LatheGeometry(profile, 8)
  }, [])
  const edges = useMemo(() => new EdgesGeometry(geometry, 20), [geometry])

  useFrame((state, delta) => {
    const g = group.current
    if (!g) return
    g.rotation.y += delta * 0.4
    g.rotation.x = MathUtils.damp(g.rotation.x, 0.2 - state.pointer.y * 0.3, 4, delta)
    g.rotation.z = MathUtils.damp(g.rotation.z, -state.pointer.x * 0.15, 4, delta)
  })

  return (
    <group ref={group}>
      <group position={[0, 0.3, 0]}>
        <mesh geometry={geometry}>
          <meshStandardMaterial color="#f4f1ea" metalness={1} roughness={0.06} flatShading envMapIntensity={1.3} />
        </mesh>
        <lineSegments geometry={edges}>
          <lineBasicMaterial color="#ff8200" transparent opacity={0.55} />
        </lineSegments>
      </group>
    </group>
  )
}

export default function Gem3D({ visible }) {
  return (
    <Canvas
      camera={{ position: [0, 0.2, 3.6], fov: 38 }}
      dpr={[1, 1.5]}
      frameloop={visible ? 'always' : 'never'}
      gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
    >
      <Studio />
      <pointLight color="#ff9a2e" intensity={25} position={[-3, 1, 3]} />
      <pointLight color="#ffffff" intensity={18} position={[3, 3, 2]} />
      <Gem />
    </Canvas>
  )
}
