import { useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { MathUtils, Object3D, Vector3 } from 'three'
import { bloom, clamp01, easeOut, nodeT, slot, smooth } from '../lib/bloom'

// One smooth liquid-metal blob plus up to 12 small droplets that bud off it as the visitor scrolls.
// Two draw calls in total (blob + one InstancedMesh). No textures, no refraction, no post-processing:
// the "chrome" is a procedural studio evaluated in the fragment shader, in the site's own colours
// (paper white, neutral greys, and amber as the single accent).

const COMMON_VERT_OUT = /* glsl */ `
  varying vec3 vN;
  varying vec3 vW;
`

const blobVertex = /* glsl */ `
  uniform float uTime;
  uniform float uAmp;
  uniform float uLean;
  uniform float uHeat;
  uniform float uBloom;
  uniform vec3 uDir;
  ${COMMON_VERT_OUT}

  // Cheap domain-warped sines: smooth, swirly, no noise textures.
  float field(vec3 p, float t) {
    p += 0.4 * vec3(sin(p.y * 2.3 + t * 0.5), sin(p.z * 2.1 - t * 0.4), sin(p.x * 2.7 + t * 0.3));
    return 0.5 * sin(p.x * 2.2 + p.y * 1.3 + t * 0.35)
         + 0.3 * sin(p.y * 3.1 - p.z * 1.7 - t * 0.45)
         + 0.2 * sin(p.z * 3.7 + p.x * 2.1 + t * 0.6);
  }

  vec3 shape(vec3 p) {
    float toward = max(dot(p, uDir), 0.0);
    float r = 1.0
      + uAmp * field(p * 1.3, uTime)
      + 0.42 * uLean * pow(toward, 2.5)
      + 0.05 * uHeat * sin(dot(p, uDir) * 9.0 - uTime * 5.0) * pow(toward, 1.5)
      + 0.12 * uBloom * field(p * 2.1, -uTime * 0.7);
    return p * r;
  }

  void main() {
    vec3 p = normalize(position);
    vec3 up = abs(p.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
    vec3 t1 = normalize(cross(up, p));
    vec3 t2 = cross(p, t1);
    vec3 a = shape(p);
    vec3 b = shape(normalize(p + t1 * 0.02));
    vec3 c = shape(normalize(p + t2 * 0.02));
    vec3 n = normalize(cross(b - a, c - a));
    if (dot(n, p) < 0.0) n = -n;
    vec4 w = modelMatrix * vec4(a, 1.0);
    vN = normalize(mat3(modelMatrix) * n);
    vW = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`

const dropVertex = /* glsl */ `
  ${COMMON_VERT_OUT}
  void main() {
    mat4 m = modelMatrix;
    #ifdef USE_INSTANCING
      m = m * instanceMatrix;
    #endif
    vN = normalize(mat3(m) * normal);
    vec4 w = m * vec4(position, 1.0);
    vW = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`

const fragment = /* glsl */ `
  varying vec3 vN;
  varying vec3 vW;

  // Procedural studio: dark floor, soft grey sky, paper-white softboxes, one amber kicker.
  vec3 env(vec3 d) {
    float y = d.y * 0.5 + 0.5;
    vec3 c = mix(vec3(0.02), vec3(0.42, 0.43, 0.45), pow(y, 1.5));
    float a = atan(d.z, d.x);
    c += vec3(1.0) * smoothstep(0.86, 0.94, sin(a * 2.0 + 1.3) * 0.5 + 0.5) * smoothstep(-0.2, 0.6, d.y) * 1.5;
    c += vec3(1.0) * smoothstep(0.94, 0.99, dot(d, normalize(vec3(-0.5, 0.7, 0.5)))) * 2.4;
    c += vec3(1.0, 0.51, 0.0) * smoothstep(0.88, 0.98, dot(d, normalize(vec3(0.8, 0.1, -0.4)))) * 1.5;
    return c;
  }

  void main() {
    vec3 N = normalize(vN);
    vec3 V = normalize(vW - cameraPosition);
    float ndv = max(dot(-V, N), 0.0);
    float fres = pow(1.0 - ndv, 3.0);
    vec3 col = env(reflect(V, N)) * mix(vec3(0.78), vec3(1.0), fres);
    col += vec3(1.0, 0.93, 0.84) * fres * 0.45; // the quiet rim glow
    col = 1.0 - exp(-col * 1.15);
    gl_FragColor = vec4(pow(col, vec3(0.4545)), 1.0);
  }
`

const CAM_Z = 3.6
const FOV = 38
const MAX_DROPS = 12
const BLOB_RADIUS = 0.48
const dummy = new Object3D()

function Bloom() {
  const size = useThree((s) => s.size)
  const group = useRef(null)
  const blob = useRef(null)
  const drops = useRef(null)
  const state = useRef({ x: 0, y: 0, heat: 0 })
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAmp: { value: 0.2 },
      uLean: { value: 0 },
      uHeat: { value: 0 },
      uBloom: { value: 0 },
      uDir: { value: new Vector3(0, 0, 1) },
    }),
    [],
  )

  useFrame((s, delta) => {
    if (!blob.current || !drops.current || !group.current) return
    const dt = Math.min(delta, 0.05)
    const st = state.current
    const p = bloom.p

    // Pointer: damped, and its speed feeds a "heat" that makes the surface ripple while you move.
    const px = MathUtils.clamp(bloom.px, -1.6, 1.6)
    const py = MathUtils.clamp(bloom.py, -1.6, 1.6)
    const nx = MathUtils.damp(st.x, px, 5, dt)
    const ny = MathUtils.damp(st.y, py, 5, dt)
    const speed = Math.hypot(nx - st.x, ny - st.y) / Math.max(dt, 1e-3)
    st.heat = MathUtils.damp(st.heat, Math.min(speed * 0.6, 1), 3, dt)
    st.x = nx
    st.y = ny

    const u = blob.current.material.uniforms
    u.uDir.value.set(nx * 0.9, ny * 0.9, 1).normalize()
    u.uTime.value += dt
    u.uLean.value = clamp01(Math.hypot(nx, ny) / 1.1)
    u.uHeat.value = st.heat
    u.uBloom.value = Math.sin(Math.PI * clamp01(p)) // the blob swells while the droplets leave
    group.current.scale.setScalar(BLOB_RADIUS * (1 - 0.16 * p)) // and gives up a little mass after
    group.current.rotation.y += dt * 0.12

    // Droplets: leave the surface, arc outwards, then shrink to nothing as the real link tile appears.
    const k = (2 * Math.tan((FOV * Math.PI) / 360) * CAM_Z) / size.height // world units per px
    const n = Math.min(bloom.n, MAX_DROPS)
    for (let i = 0; i < MAX_DROPS; i++) {
      if (i >= n) {
        dummy.position.set(0, 0, 0)
        dummy.scale.setScalar(0)
        dummy.updateMatrix()
        drops.current.setMatrixAt(i, dummy.matrix)
        continue
      }
      const t = nodeT(i, n, p)
      const e = easeOut(t)
      const sl = slot(i, n, bloom.angle, bloom.w)
      const gy = 1 - ((i + 0.5) * 2) / n
      const gr = Math.sqrt(1 - gy * gy)
      const th = i * 2.39996
      const r0 = BLOB_RADIUS * 0.9
      const arc = Math.sin(Math.PI * e) * 0.16
      dummy.position.set(
        MathUtils.lerp(Math.cos(th) * gr * r0, sl.x * k, e) + Math.cos(th) * arc,
        MathUtils.lerp(gy * r0, -sl.y * k, e) + Math.sin(th * 0.7) * arc * 0.6,
        MathUtils.lerp(Math.sin(th) * gr * r0, sl.s * 0.3, e),
      )
      const r = 0.055 * (1 + 0.9 * Math.sin(Math.PI * t)) * smooth(0, 0.08, t) * (1 - smooth(0.72, 1, t))
      dummy.scale.setScalar(Math.max(r, 0))
      dummy.updateMatrix()
      drops.current.setMatrixAt(i, dummy.matrix)
    }
    drops.current.instanceMatrix.needsUpdate = true
  })

  return (
    <>
      <group ref={group} scale={BLOB_RADIUS}>
        <mesh ref={blob}>
          <icosahedronGeometry args={[1, 14]} />
          <shaderMaterial vertexShader={blobVertex} fragmentShader={fragment} uniforms={uniforms} />
        </mesh>
      </group>
      <instancedMesh ref={drops} args={[undefined, undefined, MAX_DROPS]} frustumCulled={false}>
        <sphereGeometry args={[1, 18, 12]} />
        <shaderMaterial vertexShader={dropVertex} fragmentShader={fragment} />
      </instancedMesh>
    </>
  )
}

// The canvas is as wide as the whole orbit box (not just the middle 60%), so the droplets can travel
// all the way out to the ring without being clipped. It never takes pointer events: the page's
// links and buttons stay on top and work exactly as before.
export default function Gem3D({ visible }) {
  return (
    <Canvas
      style={{ position: 'absolute', inset: '-33.333%', width: 'auto', height: 'auto', pointerEvents: 'none' }}
      camera={{ position: [0, 0, CAM_Z], fov: FOV }}
      dpr={[1, 1.5]}
      frameloop={visible ? 'always' : 'never'}
      gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
    >
      <Bloom />
    </Canvas>
  )
}
