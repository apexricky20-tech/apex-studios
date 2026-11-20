import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import { Box3, MathUtils, PMREMGenerator, Vector3 } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

// A real 3D model the visitor can turn with a finger, mouse or the arrow keys. It turns slowly by itself
// until they touch it. Lit by a built-in studio (no image files to fetch), framed automatically whatever
// the model's size. Models must be .glb, plain or meshopt-compressed (Draco needs a download we do not allow).

function Studio() {
  const gl = useThree((state) => state.gl)
  const env = useMemo(() => {
    const pmrem = new PMREMGenerator(gl)
    const texture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    pmrem.dispose()
    return texture
  }, [gl])
  useEffect(() => () => env.dispose(), [env])
  return <primitive object={env} attach="environment" />
}

// Turning state lives in a small object with its own methods, so the animation loop and the pointer
// handlers share it without touching React state (no re-render per frame).
class Turn {
  active = false
  touched = false
  vx = 0
  vy = 0
  x = 0
  y = 0
  down(e) {
    this.active = this.touched = true
    this.x = e.clientX
    this.y = e.clientY
  }
  move(e) {
    if (!this.active) return
    this.vx = (e.clientX - this.x) * 0.006
    this.vy = (e.clientY - this.y) * 0.004
    this.x = e.clientX
    this.y = e.clientY
  }
  up() {
    this.active = false
  }
  key(k) {
    const step = 0.12
    if (k === 'ArrowLeft') this.vx = -step
    else if (k === 'ArrowRight') this.vx = step
    else if (k === 'ArrowUp') this.vy = -step / 2
    else if (k === 'ArrowDown') this.vy = step / 2
    else return false
    this.touched = true
    return true
  }
  apply(group, delta) {
    if (!this.active && !this.touched) group.rotation.y += delta * 0.35
    group.rotation.y += this.vx
    group.rotation.x = MathUtils.clamp(group.rotation.x + this.vy, -0.6, 0.6)
    this.vx *= 0.92
    this.vy *= 0.92
  }
}

function Model({ src, drag }) {
  const group = useRef(null)
  const gltf = useLoader(GLTFLoader, src, (loader) => loader.setMeshoptDecoder(MeshoptDecoder))
  // Centre the model and scale it to a fixed size, so any export fits the frame.
  const fit = useMemo(() => {
    const scene = gltf.scene.clone(true)
    const box = new Box3().setFromObject(scene)
    const size = box.getSize(new Vector3())
    const centre = box.getCenter(new Vector3())
    const k = 1.8 / Math.max(size.x, size.y, size.z || 1, 1e-6)
    return { scene, k, centre }
  }, [gltf])

  useFrame((_, delta) => {
    if (group.current) drag.apply(group.current, delta)
  })

  return (
    <group ref={group} scale={fit.k}>
      <primitive object={fit.scene} position={[-fit.centre.x, -fit.centre.y, -fit.centre.z]} />
    </group>
  )
}

export default function ModelViewer({ src, alt, visible }) {
  const [turn] = useState(() => new Turn())
  return (
    <div
      role="img"
      aria-label={`${alt}. Drag, or use the arrow keys, to turn it.`}
      tabIndex={0}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture?.(e.pointerId)
        turn.down(e)
      }}
      onPointerMove={(e) => turn.move(e)}
      onPointerUp={() => turn.up()}
      onPointerCancel={() => turn.up()}
      onKeyDown={(e) => turn.key(e.key) && e.preventDefault()}
      className="h-full w-full cursor-grab touch-pan-y active:cursor-grabbing focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber"
    >
      <Canvas
        camera={{ position: [0, 0.4, 4.2], fov: 38 }}
        dpr={[1, 1.5]}
        frameloop={visible ? 'always' : 'never'}
        gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
      >
        <Studio />
        <directionalLight position={[3, 4, 2]} intensity={1.4} />
        <pointLight position={[-3, 1, -2]} intensity={14} color="#ff8200" />
        <Model src={src} drag={turn} />
      </Canvas>
    </div>
  )
}
