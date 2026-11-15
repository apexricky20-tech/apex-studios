import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  BoxGeometry,
  BufferGeometry,
  CatmullRomCurve3,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  EdgesGeometry,
  ExtrudeGeometry,
  Float32BufferAttribute,
  IcosahedronGeometry,
  LatheGeometry,
  OctahedronGeometry,
  Path,
  QuadraticBezierCurve3,
  Shape,
  Vector2,
  Vector3,
} from 'three'

// Every scene is built from a few dozen lines of code: no model files to download.
// They are drawn as thin outlines with a very faint fill, so they read as a blueprint
// behind the content instead of competing with it. Amber is used for one accent per scene.

const AMBER = '#ff8200'
const PAPER = '#ffffff'
const TAU = Math.PI * 2

// ---------- geometry helpers (each built once, then reused) ----------

const once = (fn) => {
  let value
  return () => (value ??= fn())
}
const keyed = (fn) => {
  const cache = new Map()
  return (...args) => {
    const key = args.join('|')
    if (!cache.has(key)) cache.set(key, fn(...args))
    return cache.get(key)
  }
}

const edgeCache = new WeakMap()
const edgesOf = (geometry, angle) => {
  let edges = edgeCache.get(geometry)
  if (!edges) {
    edges = new EdgesGeometry(geometry, angle)
    edgeCache.set(geometry, edges)
  }
  return edges
}

const fromPoints = (flat) => {
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(flat, 3))
  return g
}
const segments = (pts) => {
  const flat = []
  for (let i = 0; i < pts.length - 1; i++) flat.push(...pts[i], ...pts[i + 1])
  return fromPoints(flat)
}
const circle = keyed((radius, n = 64) => {
  const flat = []
  for (let i = 0; i < n; i++) flat.push(Math.cos((i / n) * TAU) * radius, Math.sin((i / n) * TAU) * radius, 0)
  return fromPoints(flat)
})

const box = keyed((w, h, d) => new BoxGeometry(w, h, d))
const oct = keyed((r) => new OctahedronGeometry(r))
const ico = keyed((r, detail = 0) => new IcosahedronGeometry(r, detail))

// small seeded random so layouts are identical on every visit
function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ---------- drawing helpers ----------

// outline of a solid, with an optional very faint fill
function Wire({ geometry, color = PAPER, opacity = 0.4, fill = 0, angle = 25, ref, ...props }) {
  return (
    <group ref={ref} {...props}>
      <lineSegments geometry={edgesOf(geometry, angle)}>
        <lineBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} />
      </lineSegments>
      {fill > 0 && (
        <mesh geometry={geometry}>
          <meshBasicMaterial color={color} transparent opacity={fill} depthWrite={false} side={DoubleSide} />
        </mesh>
      )}
    </group>
  )
}

function Seg({ geometry, color = PAPER, opacity = 0.4, ref, ...props }) {
  return (
    <lineSegments ref={ref} geometry={geometry} {...props}>
      <lineBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} />
    </lineSegments>
  )
}

function Ring({ radius, color = PAPER, opacity = 0.35, segs = 64, ref, ...props }) {
  return (
    <lineLoop ref={ref} geometry={circle(radius, segs)} {...props}>
      <lineBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} />
    </lineLoop>
  )
}

function Dot({ size = 0.06, color = AMBER, opacity = 0.9, ref, ...props }) {
  return (
    <mesh ref={ref} {...props}>
      <icosahedronGeometry args={[size, 0]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} />
    </mesh>
  )
}

const bob = (t, i, amount = 0.08, speed = 0.6) => Math.sin(t * speed + i * 1.7) * amount

// ---------- /work : a gallery wall of project frames ----------

const FRAMES = [
  [-1.04, 0.08, -0.35, 0.4],
  [-0.52, -0.16, -0.1, 0.22],
  [0, 0.12, 0, 0],
  [0.52, -0.16, -0.1, -0.22],
  [1.04, 0.08, -0.35, -0.4],
]

export function WorkScene() {
  const refs = useRef([])
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    refs.current.forEach((g, i) => {
      if (g) g.position.y = FRAMES[i][1] + bob(t, i)
    })
  })
  return (
    <>
      {FRAMES.map(([x, y, z, ry], i) => (
        <group
          key={x}
          ref={(el) => {
            refs.current[i] = el
          }}
          position={[x, y, z]}
          rotation={[0, ry, 0]}
        >
          <Wire geometry={box(0.62, 0.86, 0.04)} opacity={0.5} fill={0.04} />
          <Wire geometry={box(0.5, 0.48, 0.02)} position={[0, 0.11, 0.03]} color={i === 2 ? AMBER : PAPER} opacity={i === 2 ? 0.8 : 0.3} fill={i === 2 ? 0.08 : 0} />
          <Wire geometry={box(0.34, 0.035, 0.01)} position={[-0.08, -0.22, 0.03]} opacity={0.3} />
          <Wire geometry={box(0.24, 0.035, 0.01)} position={[-0.13, -0.3, 0.03]} opacity={0.2} />
        </group>
      ))}
    </>
  )
}

// ---------- /services : a menu of nine, with a highlight that hops between them ----------

export function ServicesScene() {
  const pick = useRef(null)
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const n = Math.floor(t / 1.1) % 9
    const g = pick.current
    if (!g) return
    const tx = ((n % 3) - 1) * 0.85
    const ty = (1 - Math.floor(n / 3)) * 0.85
    g.position.x += (tx - g.position.x) * 0.15
    g.position.y += (ty - g.position.y) * 0.15
    g.scale.setScalar(1 + Math.sin(t * 4) * 0.03)
  })
  return (
    <group rotation={[0.15, -0.3, 0]}>
      {Array.from({ length: 9 }, (_, i) => (
        <Wire key={i} geometry={box(0.55, 0.55, 0.55)} position={[((i % 3) - 1) * 0.85, (1 - Math.floor(i / 3)) * 0.85, 0]} opacity={0.35} fill={0.03} />
      ))}
      <Wire ref={pick} geometry={box(0.7, 0.7, 0.7)} color={AMBER} opacity={0.9} fill={0.1} />
    </group>
  )
}

// ---------- /website-design : three stacked browser windows ----------

function Browser({ accent }) {
  return (
    <group>
      <Wire geometry={box(2.2, 1.45, 0.03)} opacity={0.5} fill={0.05} />
      <Wire geometry={box(2.2, 0.2, 0.04)} position={[0, 0.625, 0]} opacity={0.4} />
      {[-0.95, -0.8, -0.65].map((x) => (
        <Wire key={x} geometry={box(0.07, 0.07, 0.05)} position={[x, 0.625, 0]} color={x === -0.95 ? AMBER : PAPER} opacity={0.6} />
      ))}
      <Wire geometry={box(1.1, 0.55, 0.04)} position={[-0.4, 0.12, 0]} opacity={0.35} />
      <Wire geometry={box(0.6, 0.55, 0.04)} position={[0.72, 0.12, 0]} color={accent ? AMBER : PAPER} opacity={accent ? 0.8 : 0.35} fill={accent ? 0.1 : 0} />
      <Wire geometry={box(1.7, 0.06, 0.04)} position={[-0.2, -0.38, 0]} opacity={0.3} />
      <Wire geometry={box(1.2, 0.06, 0.04)} position={[-0.45, -0.52, 0]} opacity={0.25} />
    </group>
  )
}

export function WebsiteScene() {
  const refs = useRef([])
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    refs.current.forEach((g, i) => {
      if (g) g.position.y = (i - 1) * 0.18 + bob(t, i, 0.06)
    })
  })
  return (
    <group rotation={[0, -0.5, 0]}>
      {[0, 1, 2].map((i) => (
        <group
          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
          position={[i * 0.3 - 0.3, (i - 1) * 0.18, -i * 0.7 + 0.7]}
        >
          <Browser accent={i === 0} />
        </group>
      ))}
    </group>
  )
}

// ---------- /development : layers of code blocks that shift against each other ----------

const lattice = once(() => {
  const flat = []
  const size = 0.5
  const step = 0.62
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      const cx = i * step
      const cz = j * step
      const corner = (k) => [cx + ((k & 1) - 0.5) * size, (((k >> 1) & 1) - 0.5) * 0.26, cz + (((k >> 2) & 1) - 0.5) * size]
      for (let k = 0; k < 8; k++) {
        for (const bit of [1, 2, 4]) if (!(k & bit)) flat.push(...corner(k), ...corner(k | bit))
      }
    }
  }
  return fromPoints(flat)
})

export function DevelopmentScene() {
  const refs = useRef([])
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    refs.current.forEach((g, i) => {
      if (!g) return
      g.rotation.y = Math.sin(t * 0.35 + i * 1.2) * 0.35
      g.position.y = (i - 1) * 0.7 + bob(t, i, 0.05)
    })
  })
  return (
    <group rotation={[0.35, -0.4, 0]}>
      {[0, 1, 2].map((i) => (
        <Seg
          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
          geometry={lattice()}
          color={i === 1 ? AMBER : PAPER}
          opacity={i === 1 ? 0.8 : 0.4}
          position={[0, (i - 1) * 0.7, 0]}
        />
      ))}
    </group>
  )
}

// ---------- /automation : three gears that mesh and turn together ----------

const gear = keyed((teeth, radius) => {
  const shape = new Shape()
  const pitch = TAU / teeth
  const root = radius * 0.84
  for (let i = 0; i < teeth; i++) {
    const a = i * pitch
    const pts = [
      [a - pitch * 0.3, root],
      [a - pitch * 0.16, radius],
      [a + pitch * 0.16, radius],
      [a + pitch * 0.3, root],
    ]
    pts.forEach(([ang, r], k) => {
      const x = Math.cos(ang) * r
      const y = Math.sin(ang) * r
      if (i === 0 && k === 0) shape.moveTo(x, y)
      else shape.lineTo(x, y)
    })
  }
  shape.closePath()
  const hole = new Path()
  hole.absarc(0, 0, radius * 0.3, 0, TAU, true)
  shape.holes.push(hole)
  return new ExtrudeGeometry(shape, { depth: 0.16, bevelEnabled: false, curveSegments: 6 })
})

export function AutomationScene() {
  const a = useRef(null)
  const b = useRef(null)
  const c = useRef(null)
  useFrame(({ clock }) => {
    const w = clock.elapsedTime * 0.25
    if (a.current) a.current.rotation.z = w
    if (b.current) b.current.rotation.z = -w * (14 / 10) + Math.PI / 10
    if (c.current) c.current.rotation.z = w * (14 / 8)
  })
  return (
    <group rotation={[0.1, -0.45, 0]} position={[-0.35, 0, 0]} scale={0.8}>
      <Wire ref={a} geometry={gear(14, 1)} position={[-0.7, 0.3, 0]} angle={35} opacity={0.5} fill={0.05} />
      <Wire ref={b} geometry={gear(10, 0.714)} position={[0.91, -0.29, 0]} angle={35} color={AMBER} opacity={0.85} fill={0.08} />
      <Wire ref={c} geometry={gear(8, 0.571)} position={[1.71, 0.71, 0]} angle={35} opacity={0.45} fill={0.05} />
    </group>
  )
}

// ---------- /branding : a faceted form with orbiting colour swatches ----------

export function BrandingScene() {
  const core = useRef(null)
  const swatches = useRef([])
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (core.current) {
      core.current.rotation.y = t * 0.3
      core.current.rotation.x = t * 0.15
    }
    swatches.current.forEach((d, i) => {
      if (!d) return
      const a = t * (0.5 + i * 0.15) + i * 2.1
      const r = 1.3 + (i % 2) * 0.25
      d.position.set(Math.cos(a) * r, Math.sin(a) * r * 0.45, Math.sin(a) * r * 0.5)
    })
  })
  return (
    <group rotation={[0.3, 0, 0.15]}>
      <Wire ref={core} geometry={ico(0.85, 1)} opacity={0.5} fill={0.05} angle={5} />
      <Ring radius={1.3} rotation={[1.3, 0, 0]} opacity={0.25} />
      <Ring radius={1.55} rotation={[1.1, 0, 0]} opacity={0.15} />
      {[AMBER, PAPER, AMBER, PAPER].map((color, i) => (
        <Dot
          key={i}
          ref={(el) => {
            swatches.current[i] = el
          }}
          size={0.07 + (i % 2) * 0.03}
          color={color}
        />
      ))}
    </group>
  )
}

// ---------- /google-business-profile : a map pin dropping onto a street grid ----------

const pin = once(
  () =>
    new LatheGeometry(
      [
        [0, -1.1],
        [0.08, -0.85],
        [0.22, -0.5],
        [0.42, -0.15],
        [0.54, 0.2],
        [0.55, 0.5],
        [0.45, 0.8],
        [0.25, 0.97],
        [0, 1],
      ].map(([x, y]) => new Vector2(x, y)),
      16,
    ),
)

export function ProfileScene() {
  const rippleRefs = useRef([])
  const pinRef = useRef(null)
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    rippleRefs.current.forEach((r, i) => {
      if (!r) return
      const p = (t * 0.35 + i / 3) % 1
      r.scale.setScalar(0.3 + p * 1.7)
      r.material.opacity = (1 - p) * 0.5
    })
    if (pinRef.current) pinRef.current.position.y = 0.15 + Math.abs(Math.sin(t * 1.4)) * 0.18
  })
  return (
    <group rotation={[0.45, 0, 0]}>
      <gridHelper args={[4.4, 11, PAPER, PAPER]} position={[0, -1.15, 0]} material-transparent material-opacity={0.12} material-depthWrite={false} />
      {[0, 1, 2].map((i) => (
        <Ring
          key={i}
          ref={(el) => {
            rippleRefs.current[i] = el
          }}
          radius={1}
          color={AMBER}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -1.1, 0]}
        />
      ))}
      <group ref={pinRef}>
        <Wire geometry={pin()} color={AMBER} opacity={0.75} fill={0.07} angle={30} />
        <Dot size={0.2} color={PAPER} opacity={0.8} position={[0, 0.5, 0]} />
      </group>
    </group>
  )
}

// ---------- /mpesa-payments : coins hopping across to a phone ----------

const coin = once(() => new CylinderGeometry(0.5, 0.5, 0.1, 32))
const flow = once(() => new QuadraticBezierCurve3(new Vector3(-0.55, 0.9, 0), new Vector3(0.1, 1.5, 0.3), new Vector3(0.75, 0.75, 0)))

export function MpesaScene() {
  const coins = useRef([])
  const tokens = useRef([])
  const pulse = useRef(null)
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    coins.current.forEach((c, i) => {
      if (c) c.position.y = -0.75 + i * 0.15 + Math.max(0, Math.sin(t * 2 - i * 0.7)) * 0.1
    })
    tokens.current.forEach((d, i) => {
      if (!d) return
      d.position.copy(flow().getPoint((t * 0.3 + i / 5) % 1))
    })
    if (pulse.current) {
      const p = (t * 0.6) % 1
      pulse.current.scale.setScalar(0.5 + p)
      pulse.current.material.opacity = (1 - p) * 0.7
    }
  })
  return (
    <group rotation={[0.2, -0.3, 0]}>
      <group position={[-0.55, 0, 0]}>
        {[0, 1, 2, 3].map((i) => (
          <Wire
            key={i}
            ref={(el) => {
              coins.current[i] = el
            }}
            geometry={coin()}
            color={i === 3 ? AMBER : PAPER}
            opacity={i === 3 ? 0.9 : 0.45}
            fill={0.06}
            angle={40}
            position={[0, -0.75 + i * 0.15, 0]}
          />
        ))}
      </group>
      <group position={[0.75, -0.1, 0]} rotation={[0, 0, 0.1]}>
        <Wire geometry={box(0.8, 1.45, 0.07)} opacity={0.55} fill={0.05} />
        <Wire geometry={box(0.66, 1.15, 0.02)} position={[0, 0.03, 0.04]} opacity={0.25} />
        <Ring ref={pulse} radius={0.28} color={AMBER} position={[0, 0.1, 0.05]} />
        <Ring radius={0.14} color={AMBER} opacity={0.9} position={[0, 0.1, 0.05]} />
      </group>
      {[0, 1, 2, 3, 4].map((i) => (
        <Dot
          key={i}
          ref={(el) => {
            tokens.current[i] = el
          }}
          size={0.05}
        />
      ))}
    </group>
  )
}

// ---------- /whatsapp-automation : a chat that answers itself ----------

const bubble = keyed((w, h) => {
  const r = 0.2
  const x0 = -w / 2
  const x1 = w / 2
  const y0 = -h / 2
  const y1 = h / 2
  const s = new Shape()
  s.moveTo(x0 - 0.07, y0 - 0.2)
  s.lineTo(x0 + 0.4, y0)
  s.lineTo(x1 - r, y0)
  s.quadraticCurveTo(x1, y0, x1, y0 + r)
  s.lineTo(x1, y1 - r)
  s.quadraticCurveTo(x1, y1, x1 - r, y1)
  s.lineTo(x0 + r, y1)
  s.quadraticCurveTo(x0, y1, x0, y1 - r)
  s.lineTo(x0, y0 + 0.12)
  s.closePath()
  return new ExtrudeGeometry(s, { depth: 0.06, bevelEnabled: false, curveSegments: 5 })
})

export function WhatsappScene() {
  const refs = useRef([])
  const dots = useRef([])
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    refs.current.forEach((g, i) => {
      if (g) g.position.y = [0.8, 0.05, -0.75][i] + bob(t, i, 0.07, 0.7)
    })
    dots.current.forEach((d, i) => {
      if (d) d.position.y = Math.max(0, Math.sin(t * 5 - i * 0.8)) * 0.07
    })
  })
  return (
    <group rotation={[0, -0.35, 0]}>
      <Wire ref={(el) => { refs.current[0] = el }} geometry={bubble(1.6, 0.7)} position={[-0.45, 0.8, 0]} opacity={0.5} fill={0.05} />
      <Wire ref={(el) => { refs.current[1] = el }} geometry={bubble(1.3, 0.6)} position={[0.5, 0.05, 0.2]} scale={[-1, 1, 1]} color={AMBER} opacity={0.85} fill={0.09} />
      <group ref={(el) => { refs.current[2] = el }} position={[-0.4, -0.75, 0]}>
        <Wire geometry={bubble(0.9, 0.5)} opacity={0.5} fill={0.05} />
        {[-0.2, 0, 0.2].map((x, i) => (
          <Dot
            key={x}
            ref={(el) => {
              dots.current[i] = el
            }}
            size={0.045}
            color={PAPER}
            position={[x, 0, 0.1]}
          />
        ))}
      </group>
    </group>
  )
}

// ---------- /ai-assistant : a network of linked nodes with a scanning ring ----------

const network = once(() => {
  const n = 36
  const golden = Math.PI * (3 - Math.sqrt(5))
  const nodes = Array.from({ length: n }, (_, i) => {
    const y = 1 - (i / (n - 1)) * 2
    const r = Math.sqrt(1 - y * y)
    return new Vector3(Math.cos(golden * i) * r, y, Math.sin(golden * i) * r).multiplyScalar(1.25)
  })
  const seen = new Set()
  const flat = []
  nodes.forEach((p, i) => {
    nodes
      .map((q, j) => [j, p.distanceToSquared(q)])
      .filter(([j]) => j !== i)
      .sort((x, y) => x[1] - y[1])
      .slice(0, 3)
      .forEach(([j]) => {
        const key = i < j ? `${i}-${j}` : `${j}-${i}`
        if (seen.has(key)) return
        seen.add(key)
        flat.push(p.x, p.y, p.z, nodes[j].x, nodes[j].y, nodes[j].z)
      })
  })
  const all = new Float32Array(nodes.flatMap((p) => [p.x, p.y, p.z]))
  const lit = new Float32Array([0, 7, 15, 22, 29].flatMap((i) => [nodes[i].x, nodes[i].y, nodes[i].z]))
  return { links: fromPoints(flat), all: fromPoints(all), lit: fromPoints(lit) }
})

export function AssistantScene() {
  const group = useRef(null)
  const scan = useRef(null)
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (group.current) group.current.rotation.y = t * 0.15
    if (scan.current) {
      const y = Math.sin(t * 0.6) * 1.05
      scan.current.position.y = y
      scan.current.scale.setScalar(Math.sqrt(Math.max(0.01, 1.56 - y * y)))
    }
  })
  const { links, all, lit } = network()
  return (
    <group ref={group} rotation={[0.2, 0, 0.1]}>
      <Seg geometry={links} opacity={0.25} />
      <points geometry={all}>
        <pointsMaterial color={PAPER} size={0.06} sizeAttenuation transparent opacity={0.8} depthWrite={false} />
      </points>
      <points geometry={lit}>
        <pointsMaterial color={AMBER} size={0.13} sizeAttenuation transparent opacity={0.95} depthWrite={false} />
      </points>
      <Wire geometry={ico(0.3, 0)} color={AMBER} opacity={0.8} fill={0.1} />
      <Ring ref={scan} radius={1} color={AMBER} opacity={0.5} rotation={[Math.PI / 2, 0, 0]} />
    </group>
  )
}

// ---------- /care-plans : a shield with a check, and a guard orbiting it ----------

const shield = once(() => {
  const s = new Shape()
  s.moveTo(0, 1.1)
  s.lineTo(0.85, 0.8)
  s.lineTo(0.85, 0.1)
  s.bezierCurveTo(0.85, -0.55, 0.4, -0.95, 0, -1.15)
  s.bezierCurveTo(-0.4, -0.95, -0.85, -0.55, -0.85, 0.1)
  s.lineTo(-0.85, 0.8)
  s.closePath()
  return new ExtrudeGeometry(s, { depth: 0.14, bevelEnabled: false, curveSegments: 10 })
})
const tick = once(() => segments([[-0.32, 0.02, 0.2], [-0.08, -0.24, 0.2], [0.36, 0.3, 0.2]]))

export function CareScene() {
  const orbit = useRef(null)
  const guard = useRef(null)
  useFrame(({ clock }) => {
    const a = clock.elapsedTime * 0.5
    if (orbit.current) orbit.current.rotation.z = a * 0.2
    if (guard.current) guard.current.position.set(Math.cos(a) * 1.35, Math.sin(a) * 1.35, 0)
  })
  return (
    <group rotation={[0, -0.3, 0]}>
      <Wire geometry={shield()} position={[0, 0, -0.07]} opacity={0.55} fill={0.05} angle={30} />
      <Seg geometry={tick()} color={AMBER} opacity={0.95} />
      <group ref={orbit} rotation={[1.1, 0, 0]}>
        <Ring radius={1.35} opacity={0.2} />
        <Dot ref={guard} size={0.08} />
      </group>
    </group>
  )
}

// ---------- /process : a path with milestones that light up as you scroll ----------

const route = once(
  () =>
    new CatmullRomCurve3([
      new Vector3(-1.8, -0.9, 0),
      new Vector3(-0.9, -0.25, 0.3),
      new Vector3(-0.1, -0.8, -0.2),
      new Vector3(0.7, 0.1, 0.2),
      new Vector3(1.4, -0.3, 0),
      new Vector3(1.9, 0.85, 0.2),
    ]),
)
const routeLine = once(() => segments(route().getPoints(80).map((p) => [p.x, p.y, p.z])))
const MILESTONES = [0, 0.25, 0.5, 0.75, 1]

export function ProcessScene() {
  const lit = useRef([])
  const runner = useRef(null)
  useFrame(({ clock }) => {
    const max = document.documentElement.scrollHeight - window.innerHeight
    const progress = max > 0 ? window.scrollY / max : 0
    lit.current.forEach((g, i) => {
      if (g) g.visible = progress >= (i / (MILESTONES.length - 1)) * 0.95
    })
    if (runner.current) runner.current.position.copy(route().getPoint((clock.elapsedTime * 0.08) % 1))
  })
  return (
    <group rotation={[0.25, -0.25, 0]}>
      <Seg geometry={routeLine()} opacity={0.3} />
      {MILESTONES.map((t, i) => {
        const p = route().getPoint(t)
        return (
          <group key={t} position={p}>
            <Wire geometry={ico(0.14, 0)} opacity={0.5} />
            <group
              ref={(el) => {
                lit.current[i] = el
              }}
            >
              <Wire geometry={ico(0.2, 0)} color={AMBER} opacity={0.9} fill={0.12} />
            </group>
          </group>
        )
      })}
      <Dot ref={runner} size={0.05} color={PAPER} />
    </group>
  )
}

// ---------- /about : the apex, a peak with a diamond hovering above it ----------

const peak = keyed((r, h) => new ConeGeometry(r, h, 4, 1).rotateY(Math.PI / 4))
const stars = once(() => {
  const rand = rng(11)
  const flat = []
  for (let i = 0; i < 40; i++) flat.push((rand() - 0.5) * 4.2, rand() * 2.6 - 0.4, -1 - rand() * 1.2)
  return fromPoints(flat)
})

export function AboutScene() {
  const gem = useRef(null)
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (gem.current) {
      gem.current.rotation.y = t * 0.6
      gem.current.position.y = 1.35 + Math.sin(t * 0.9) * 0.08
    }
  })
  return (
    <group rotation={[0.1, 0, 0]}>
      <Wire geometry={peak(1.1, 1.9)} position={[0, -0.25, 0]} opacity={0.55} fill={0.05} angle={15} />
      <Wire geometry={peak(0.8, 1.2)} position={[-1.2, -0.6, -0.4]} opacity={0.35} fill={0.03} angle={15} />
      <Wire geometry={peak(0.7, 1)} position={[1.2, -0.7, 0.2]} opacity={0.35} fill={0.03} angle={15} />
      <Wire ref={gem} geometry={oct(0.2)} color={AMBER} opacity={0.95} fill={0.15} position={[0, 1.35, 0]} />
      <points geometry={stars()}>
        <pointsMaterial color={PAPER} size={0.035} sizeAttenuation transparent opacity={0.5} depthWrite={false} />
      </points>
    </group>
  )
}

// ---------- /contact : a paper plane looping on its way to you ----------

const plane = once(() => {
  const N = [0, 0, 1]
  const L = [-0.7, 0.1, -0.6]
  const R = [0.7, 0.1, -0.6]
  const T = [0, -0.2, -0.5]
  const C = [0, 0, -0.4]
  const g = fromPoints([...N, ...L, ...C, ...N, ...C, ...R, ...L, ...T, ...C, ...C, ...T, ...R])
  g.computeVertexNormals()
  return g
})
const TRAIL = 22
const trailGeo = once(() => fromPoints(new Float32Array(TRAIL * 3)))
const pathAt = (t, out) => out.set(Math.sin(t) * 1.35, Math.sin(t * 2) * 0.55 + 0.1, Math.cos(t) * 0.5)

export function ContactScene() {
  const body = useRef(null)
  const here = useRef(new Vector3())
  const ahead = useRef(new Vector3())
  const spot = useRef(new Vector3())
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 0.45
    const g = body.current
    if (!g) return
    pathAt(t, here.current)
    pathAt(t + 0.05, ahead.current)
    g.position.copy(here.current)
    g.lookAt(ahead.current)
    const attr = trailGeo().getAttribute('position')
    for (let k = 0; k < TRAIL; k++) {
      pathAt(t - (k + 1) * 0.07, spot.current)
      attr.setXYZ(k, spot.current.x, spot.current.y, spot.current.z)
    }
    attr.needsUpdate = true
  })
  return (
    <>
      <group ref={body} scale={0.55}>
        <Wire geometry={plane()} color={AMBER} opacity={0.9} fill={0.1} angle={1} />
      </group>
      <points geometry={trailGeo()}>
        <pointsMaterial color={PAPER} size={0.035} sizeAttenuation transparent opacity={0.45} depthWrite={false} />
      </points>
    </>
  )
}

// ---------- /articles and /terms : sheets of paper fanned out ----------

const rows = keyed((n) => {
  const flat = []
  for (let i = 0; i < n; i++) {
    const y = 0.5 - i * 0.18
    const len = i % 3 === 2 ? 0.55 : 0.85
    flat.push(-0.42, y, 0.01, -0.42 + len, y, 0.01)
  }
  return fromPoints(flat)
})

export function SheetsScene({ seal = false }) {
  const refs = useRef([])
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    refs.current.forEach((g, i) => {
      if (g) g.position.y = bob(t, i, 0.06)
    })
  })
  return (
    <group rotation={[0, -0.35, 0]}>
      {[0, 1, 2, 3].map((i) => {
        const top = i === 3
        return (
          <group
            key={i}
            ref={(el) => {
              refs.current[i] = el
            }}
            position={[-0.6 + i * 0.4, 0, -0.9 + i * 0.3]}
            rotation={[0, 0, 0.3 - i * 0.12]}
          >
            <Wire geometry={box(1.15, 1.5, 0.015)} color={top ? AMBER : PAPER} opacity={top ? 0.8 : 0.4} fill={top ? 0.06 : 0.03} />
            <Seg geometry={rows(top ? 6 : 5)} color={top ? AMBER : PAPER} opacity={top ? 0.6 : 0.25} />
            {top && !seal && <Wire geometry={box(0.12, 0.4, 0.02)} position={[0.35, 0.8, 0.01]} color={AMBER} opacity={0.9} fill={0.2} />}
            {top && seal && <Ring radius={0.18} color={AMBER} opacity={0.9} position={[0.3, -0.55, 0.02]} />}
          </group>
        )
      })}
    </group>
  )
}

// ---------- /refer : a gift passed along a chain of people ----------

const hop = keyed((ax, ay, bx, by) => new QuadraticBezierCurve3(new Vector3(ax, ay, 0), new Vector3((ax + bx) / 2, Math.max(ay, by) + 0.9, 0.2), new Vector3(bx, by, 0)))
const PEOPLE = [
  [-1.6, -0.3],
  [0, 0.4],
  [1.6, -0.3],
]

export function ReferScene() {
  const gift = useRef(null)
  const ripple = useRef([])
  useFrame(({ clock }) => {
    const t = (clock.elapsedTime * 0.25) % 2
    const leg = Math.floor(t)
    const p = t - leg
    const [a, b] = [PEOPLE[leg], PEOPLE[leg + 1]]
    if (gift.current) gift.current.position.copy(hop(a[0], a[1], b[0], b[1]).getPoint(p))
    ripple.current.forEach((r, i) => {
      if (!r) return
      const hit = i === leg + 1 ? Math.max(0, (p - 0.85) / 0.15) : 0
      r.scale.setScalar(1 + hit * 1.2)
      r.material.opacity = hit > 0 ? (1 - hit) * 0.6 : 0
    })
  })
  return (
    <group rotation={[0.15, -0.2, 0]}>
      {PEOPLE.map(([x, y], i) => (
        <group key={x} position={[x, y, 0]}>
          <Wire geometry={ico(0.24, 0)} opacity={i === 2 ? 0.3 : 0.55} fill={0.05} />
          <Ring radius={0.4} opacity={i === 2 ? 0.15 : 0.3} />
          <Ring
            ref={(el) => {
              ripple.current[i] = el
            }}
            radius={0.4}
            color={AMBER}
            opacity={0}
          />
        </group>
      ))}
      {[0, 1].map((i) => (
        <Seg
          key={i}
          geometry={segments(hop(PEOPLE[i][0], PEOPLE[i][1], PEOPLE[i + 1][0], PEOPLE[i + 1][1]).getPoints(32).map((p) => [p.x, p.y, p.z]))}
          opacity={0.2}
        />
      ))}
      <Wire ref={gift} geometry={box(0.16, 0.16, 0.16)} color={AMBER} opacity={0.95} fill={0.25} />
    </group>
  )
}

// ---------- /privacy : a padlock that sways gently ----------

const shackle = once(() => {
  const pts = []
  for (let i = 0; i <= 24; i++) {
    const a = (i / 24) * Math.PI
    pts.push([Math.cos(a) * 0.38, 0.48 + Math.sin(a) * 0.4, 0])
  }
  pts.unshift([0.38, 0.48, 0])
  pts.unshift([0.38, 0.4, 0])
  pts.push([-0.38, 0.4, 0])
  return segments(pts)
})

export function PrivacyScene() {
  const group = useRef(null)
  useFrame(({ clock }) => {
    if (group.current) group.current.rotation.y = Math.sin(clock.elapsedTime * 0.5) * 0.45
  })
  return (
    <group ref={group} position={[0, -0.1, 0]}>
      <Wire geometry={box(1.2, 0.95, 0.4)} opacity={0.55} fill={0.05} />
      {[-0.12, 0.12].map((z) => (
        <Seg key={z} geometry={shackle()} position={[0, 0.5, z]} opacity={0.55} />
      ))}
      <Ring radius={0.1} color={AMBER} opacity={0.95} position={[0, 0.08, 0.21]} />
      <Seg geometry={segments([[0, -0.02, 0.21], [0, -0.28, 0.21]])} color={AMBER} opacity={0.95} />
    </group>
  )
}

// ---------- 404 : a cube that has come apart, with one piece missing ----------

const OFFSETS = [-1, 1].flatMap((x) => [-1, 1].flatMap((y) => [-1, 1].map((z) => [x, y, z])))

export function LostScene() {
  const refs = useRef([])
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    refs.current.forEach((g, i) => {
      if (!g) return
      const [x, y, z] = OFFSETS[i]
      const away = 0.32 + Math.sin(t * 0.7 + i) * 0.1 + (i === 5 ? 0.5 : 0)
      g.position.set(x * away + x * 0.3, y * away + y * 0.3, z * away + z * 0.3)
      g.rotation.set(t * 0.2 + i, t * 0.15 + i * 0.5, 0)
    })
  })
  return (
    <group rotation={[0.35, -0.5, 0]}>
      {OFFSETS.map(([x, y, z], i) =>
        i === 3 ? (
          <Wire key={i} geometry={box(0.55, 0.55, 0.55)} position={[x * 0.62, y * 0.62, z * 0.62]} color={AMBER} opacity={0.5} fill={0.05} />
        ) : (
          <Wire
            key={i}
            ref={(el) => {
              refs.current[i] = el
            }}
            geometry={box(0.55, 0.55, 0.55)}
            opacity={0.5}
            fill={0.04}
          />
        ),
      )}
    </group>
  )
}

export function TermsScene() {
  return <SheetsScene seal />
}
