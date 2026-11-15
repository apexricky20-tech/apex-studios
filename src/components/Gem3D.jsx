import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { BufferGeometry, Float32BufferAttribute, MathUtils, ShaderMaterial, Vector3 } from 'three'

// An 8-fold brilliant cut built from 48 flat facets: table, crown, girdle and pavilion.
// Faces are flat-shaded and the whole crystal is one mesh, so it costs a single draw call.
function buildCrystal() {
  const step = Math.PI / 4
  const ring = (r, y, offset) =>
    Array.from({ length: 8 }, (_, i) => [r * Math.cos((i + offset) * step), y, r * Math.sin((i + offset) * step)])
  const table = ring(0.56, 0.46, 0)
  const girdle = ring(1, 0, 0.5)
  const pavilion = ring(0.52, -0.42, 0)
  const culet = [0, -0.92, 0]
  const next = (i) => (i + 1) % 8

  const tris = []
  for (let i = 1; i < 7; i++) tris.push([table[0], table[i], table[i + 1]])
  for (let i = 0; i < 8; i++) {
    tris.push([table[i], table[next(i)], girdle[i]]) // crown bezel
    tris.push([table[next(i)], girdle[next(i)], girdle[i]]) // crown upper girdle
    tris.push([girdle[i], pavilion[next(i)], girdle[next(i)]]) // pavilion upper
    tris.push([pavilion[i], girdle[i], pavilion[next(i)]]) // pavilion lower
    tris.push([pavilion[i], pavilion[next(i)], culet]) // pavilion main
  }

  const centre = new Vector3(0, -0.1, 0)
  const positions = []
  const normals = []
  const a = new Vector3()
  const b = new Vector3()
  const c = new Vector3()
  const n = new Vector3()
  const mid = new Vector3()
  for (const [p, q, r] of tris) {
    a.set(...p)
    b.set(...q)
    c.set(...r)
    n.crossVectors(b.clone().sub(a), c.clone().sub(a))
    mid.copy(a).add(b).add(c).divideScalar(3).sub(centre)
    const flip = n.dot(mid) < 0 // keep every face pointing outward
    n.normalize()
    if (flip) n.negate()
    const order = flip ? [a, c, b] : [a, b, c]
    for (const v of order) {
      positions.push(v.x, v.y, v.z)
      normals.push(n.x, n.y, n.z)
    }
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('normal', new Float32BufferAttribute(normals, 3))
  return geometry
}

const vertexShader = /* glsl */ `
  varying vec3 vN;
  varying vec3 vW;
  void main() {
    vN = normalize(mat3(modelMatrix) * normal);
    vW = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.0);
  }
`

// Refraction is faked: a procedural studio, a slightly different bend for red, green and blue
// (the coloured "fire"), and one pretend internal bounce. No textures, no ray tracing.
const fragmentShader = /* glsl */ `
  varying vec3 vN;
  varying vec3 vW;

  vec3 env(vec3 d) {
    vec3 c = mix(vec3(0.05, 0.055, 0.07), vec3(0.30, 0.33, 0.40), d.y * 0.5 + 0.5);
    float a = atan(d.z, d.x);
    c += vec3(1.0, 0.97, 0.92) * smoothstep(0.90, 0.96, sin(a * 3.0 + 1.0) * 0.5 + 0.5) * smoothstep(-0.3, 0.5, d.y) * 2.4;
    c += vec3(0.75, 0.88, 1.0) * smoothstep(0.93, 0.985, dot(d, normalize(vec3(-0.5, 0.6, 0.6)))) * 3.5;
    c += vec3(1.0, 0.51, 0.0) * smoothstep(0.90, 0.98, dot(d, normalize(vec3(0.7, 0.2, -0.5)))) * 3.2;
    c += vec3(1.0, 0.62, 0.2) * smoothstep(0.92, 0.99, dot(d, normalize(vec3(-0.8, -0.1, 0.3)))) * 1.8;
    c += vec3(0.95, 0.9, 1.0) * smoothstep(0.94, 0.99, dot(d, normalize(vec3(0.1, -0.8, 0.5)))) * 1.6;
    return c;
  }

  vec3 through(vec3 V, vec3 N, float ior) {
    vec3 r = refract(V, N, 1.0 / ior);
    vec3 b = normalize(-N * 0.55 + vW * 0.9 + vec3(0.0, 0.35, 0.0));
    return env(normalize(mix(r, reflect(r, b), 0.7)));
  }

  void main() {
    vec3 N = normalize(vN);
    vec3 V = normalize(vW - cameraPosition);
    float fresnel = 0.05 + 0.95 * pow(1.0 - max(dot(-V, N), 0.0), 4.0);
    vec3 col = vec3(through(V, N, 2.34).r, through(V, N, 2.42).g, through(V, N, 2.53).b);
    col *= vec3(0.94, 0.98, 1.05) * (0.8 + 0.4 * dot(N, normalize(vec3(0.3, 0.8, 0.5))));
    col += env(reflect(V, N)) * fresnel * 1.4;
    col = 1.0 - exp(-col * 1.25);
    gl_FragColor = vec4(pow(col, vec3(0.4545)), 1.0);
  }
`

function Gem() {
  const group = useRef(null)
  const geometry = useMemo(() => buildCrystal(), [])
  const material = useMemo(() => new ShaderMaterial({ vertexShader, fragmentShader }), [])
  useEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
    },
    [geometry, material],
  )

  useFrame((state, delta) => {
    const g = group.current
    if (!g) return
    g.rotation.y += delta * 0.3
    g.rotation.x = MathUtils.damp(g.rotation.x, 0.42 - state.pointer.y * 0.25, 4, delta)
    g.rotation.z = MathUtils.damp(g.rotation.z, -state.pointer.x * 0.12, 4, delta)
  })

  return (
    <group ref={group} position={[0, 0.1, 0]} scale={0.82}>
      <mesh geometry={geometry} material={material} />
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
      <Gem />
    </Canvas>
  )
}
