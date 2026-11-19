import { useEffect, useRef } from 'react'

// A slowly turning 3D network behind the home page: points in depth, links between near neighbours, and
// small amber pulses travelling along the links (orders, payments and messages moving through a system,
// which is what Apex builds). It turns with the page as you scroll and leans towards the mouse.
// Plain canvas 2D, no library. It stops when the tab is hidden or the field is off screen, drops to
// fewer points on phones and older devices (tier 1), and is never loaded for reduced motion or data saver
// (see AmbientField.jsx and lib/scene3d.js). Purely decorative: no text, no claims, no data.
const rand = (a, b) => a + Math.random() * (b - a)

function build(count) {
  const nodes = Array.from({ length: count }, (_, i) => {
    // a rounded cloud, wider than tall, so it fills a landscape screen without long stray links
    const u = Math.random() * 6.2832
    const v = Math.acos(rand(-1, 1))
    const r = 1.2 * Math.cbrt(Math.random())
    return { x: r * Math.sin(v) * Math.cos(u) * 1.5, y: r * Math.cos(v) * 0.95, z: r * Math.sin(v) * Math.sin(u), hot: i % 6 === 0, r: rand(1.3, 2.6) }
  })
  const edges = []
  nodes.forEach((a, i) => {
    nodes
      .map((b, j) => ({ j, d: (a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2 }))
      .filter((o) => o.j > i && o.d < 0.34)
      .sort((p, q) => p.d - q.d)
      .slice(0, 3)
      .forEach((o) => edges.push([i, o.j]))
  })
  return { nodes, edges }
}

export default function Constellation({ tier = 2 }) {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return undefined
    const light = tier < 2
    const { nodes, edges } = build(light ? 52 : 104)
    const dpr = Math.min(window.devicePixelRatio || 1, light ? 1 : 1.5)
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    let w = 0
    let h = 0
    let raf = 0
    let last = 0
    let spin = rand(0, 6)
    let lastY = window.scrollY
    let vel = 0
    let spawn = 0
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 }
    const pulses = []
    let visible = true

    const size = () => {
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const frame = (t) => {
      raf = requestAnimationFrame(frame)
      const dt = Math.min(0.05, (t - last) / 1000 || 0.016)
      if (light && t - last < 33) return
      last = t

      const y = window.scrollY
      vel += ((y - lastY) / Math.max(dt, 0.001) / 1800 - vel) * 0.12 // smoothed scroll speed
      lastY = y
      mouse.x += (mouse.tx - mouse.x) * 0.05
      mouse.y += (mouse.ty - mouse.y) * 0.05
      spin += dt * 0.05 + vel * dt * 0.35
      const a = spin + mouse.x * 0.35 + y * 0.00025
      const b = 0.28 + mouse.y * 0.18
      const ca = Math.cos(a)
      const sa = Math.sin(a)
      const cb = Math.cos(b)
      const sb = Math.sin(b)
      const S = Math.max(Math.min(w * 0.36, h * 0.78), 230)

      const P = nodes.map((n) => {
        const x1 = n.x * ca + n.z * sa
        const z1 = -n.x * sa + n.z * ca
        const y2 = n.y * cb - z1 * sb
        const z2 = n.y * sb + z1 * cb
        const p = 2.4 / (2.4 + z2)
        return { x: w / 2 + x1 * S * p, y: h / 2 + y2 * S * p, p, d: Math.min(1, Math.max(0, (p - 0.62) / 0.7)) }
      })

      ctx.clearRect(0, 0, w, h)
      ctx.lineWidth = 1
      for (const [i, j] of edges) {
        const A = P[i]
        const B = P[j]
        const al = 0.05 + 0.24 * ((A.d + B.d) / 2)
        ctx.strokeStyle = `rgba(255,255,255,${al.toFixed(3)})`
        ctx.beginPath()
        ctx.moveTo(A.x, A.y)
        ctx.lineTo(B.x, B.y)
        ctx.stroke()
      }
      nodes.forEach((n, i) => {
        const q = P[i]
        ctx.fillStyle = n.hot ? `rgba(255,130,0,${(0.35 + 0.55 * q.d).toFixed(3)})` : `rgba(255,255,255,${(0.12 + 0.4 * q.d).toFixed(3)})`
        ctx.beginPath()
        ctx.arc(q.x, q.y, n.r * q.p, 0, 6.2832)
        ctx.fill()
        if (n.hot) {
          ctx.fillStyle = `rgba(255,130,0,${(0.05 + 0.1 * q.d).toFixed(3)})`
          ctx.beginPath()
          ctx.arc(q.x, q.y, n.r * q.p * 4.5, 0, 6.2832)
          ctx.fill()
        }
      })

      spawn -= dt
      if (spawn <= 0 && pulses.length < (light ? 5 : 11) && edges.length) {
        pulses.push({ e: edges[(Math.random() * edges.length) | 0], t: 0, dir: Math.random() < 0.5 ? 1 : -1 })
        spawn = rand(0.25, 0.7)
      }
      for (let k = pulses.length - 1; k >= 0; k--) {
        const u = pulses[k]
        u.t += dt * (0.55 + Math.min(2.5, Math.abs(vel)))
        if (u.t >= 1) {
          pulses.splice(k, 1)
          continue
        }
        const A = P[u.dir > 0 ? u.e[0] : u.e[1]]
        const B = P[u.dir > 0 ? u.e[1] : u.e[0]]
        const x = A.x + (B.x - A.x) * u.t
        const yy = A.y + (B.y - A.y) * u.t
        const tx = A.x + (B.x - A.x) * Math.max(0, u.t - 0.14)
        const ty = A.y + (B.y - A.y) * Math.max(0, u.t - 0.14)
        const fade = Math.sin(Math.PI * u.t)
        const g = ctx.createLinearGradient(tx, ty, x, yy)
        g.addColorStop(0, 'rgba(255,130,0,0)')
        g.addColorStop(1, `rgba(255,170,60,${(0.9 * fade).toFixed(3)})`)
        ctx.strokeStyle = g
        ctx.lineWidth = 1.6
        ctx.beginPath()
        ctx.moveTo(tx, ty)
        ctx.lineTo(x, yy)
        ctx.stroke()
        ctx.fillStyle = `rgba(255,190,100,${(0.95 * fade).toFixed(3)})`
        ctx.beginPath()
        ctx.arc(x, yy, 2, 0, 6.2832)
        ctx.fill()
      }
    }

    const run = () => {
      if (!raf && visible && !document.hidden) {
        last = performance.now()
        lastY = window.scrollY
        raf = requestAnimationFrame(frame)
      }
    }
    const stop = () => {
      cancelAnimationFrame(raf)
      raf = 0
    }
    const onMove = (e) => {
      mouse.tx = (e.clientX / window.innerWidth) * 2 - 1
      mouse.ty = (e.clientY / window.innerHeight) * 2 - 1
    }
    const onVis = () => (document.hidden ? stop() : run())

    size()
    const ro = new ResizeObserver(size)
    ro.observe(canvas)
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      if (visible) run()
      else stop()
    })
    io.observe(canvas)
    document.addEventListener('visibilitychange', onVis)
    if (fine) window.addEventListener('pointermove', onMove, { passive: true })
    run()
    return () => {
      stop()
      ro.disconnect()
      io.disconnect()
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('pointermove', onMove)
    }
  }, [tier])

  return <canvas ref={ref} className="constellation" />
}
