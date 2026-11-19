// The background fields. Plain canvas 2D, no library, no model files. Each kind is a function that
// builds its state once and returns a draw(c, s) for every frame, where s is
// { w, h, t, dt, p (page or footer scroll 0..1), vel (scroll speed), mx, my (pointer -1..1) }.
// They are decorative: no text, no claims. Counts drop on phones and older devices (light).
const TAU = Math.PI * 2
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v))
const lerp = (a, b, k) => a + (b - a) * k

// Hotel-lobby bokeh: soft discs rising slowly at different depths. Warm and unhurried.
function bokeh({ n = 1, amber = 0.35 }, rand, light) {
  const items = Array.from({ length: Math.round((light ? 16 : 30) * n) }, () => ({
    x: rand(), y: rand(), z: 0.15 + rand() * 0.85, ph: rand() * TAU, hot: rand() < amber,
  }))
  return (c, s) => {
    const k = Math.min(1, s.w / 900 + 0.5)
    c.lineWidth = 1
    for (const o of items) {
      o.y -= s.dt * (0.012 + 0.03 * o.z) + s.vel * s.dt * 0.012 * o.z
      if (o.y < -0.2) {
        o.y = 1.2
        o.x = rand()
      } else if (o.y > 1.25) o.y = -0.15
      const x = (o.x + Math.sin(s.t * 0.25 + o.ph) * 0.012) * s.w + s.mx * 26 * o.z
      const r = (18 + 92 * o.z) * k
      const a = 0.025 + 0.06 * o.z
      c.beginPath()
      c.arc(x, o.y * s.h, r, 0, TAU)
      c.fillStyle = o.hot ? `rgba(255,130,0,${a * 1.6})` : `rgba(255,255,255,${a})`
      c.fill()
      c.strokeStyle = o.hot ? `rgba(255,170,60,${a * 2.6})` : `rgba(255,255,255,${a * 2.2})`
      c.stroke()
    }
  }
}

// Silk: a sheet of thin lines that rolls like fabric. It drifts with the scroll and breathes.
function ribbons({ lines = 20, speed = 1 }, rand, light) {
  const L = light ? Math.round(lines * 0.6) : lines
  const ph = rand() * TAU
  const k = 1.6 + rand() * 1.2
  const step = light ? 18 : 10
  return (c, s) => {
    const base = s.h * (0.5 - (s.p - 0.5) * 0.18) + s.my * 14
    c.lineWidth = 1
    for (let i = 0; i < L; i++) {
      const u = i / (L - 1)
      c.beginPath()
      for (let x = 0; x <= s.w + step; x += step) {
        const nx = x / s.w
        const y =
          base +
          (u - 0.5) * s.h * 0.34 * (0.6 + 0.4 * Math.sin(nx * Math.PI + s.t * 0.12 * speed)) +
          Math.sin(nx * Math.PI * k + s.t * 0.35 * speed + ph + u * 1.7) * s.h * 0.09 +
          Math.sin(nx * Math.PI * k * 2.6 - s.t * 0.22 * speed + u * 2.4) * s.h * 0.03
        if (x === 0) c.moveTo(x, y)
        else c.lineTo(x, y)
      }
      const a = 0.05 + 0.17 * (1 - Math.abs(u - 0.5) * 1.6)
      c.strokeStyle = i % 7 === 3 ? `rgba(255,150,40,${(a * 1.8).toFixed(3)})` : `rgba(255,255,255,${a.toFixed(3)})`
      c.stroke()
    }
  }
}

// Flow: short trails carried along an invisible current. Faster when you scroll fast.
function flow({ n = 1, amber = 0.15, scale = 1 }, rand, light) {
  const N = Math.round((light ? 40 : 90) * n)
  const LEN = light ? 14 : 24
  const ps = Array.from({ length: N }, () => ({ x: rand(), y: rand(), pts: [], hot: rand() < amber, life: rand() * 8 }))
  return (c, s) => {
    const asp = s.w / s.h
    c.lineWidth = 1.2
    for (const p of ps) {
      const a =
        (Math.sin(p.x * asp * 3.1 * scale + s.t * 0.15) + Math.cos(p.y * 2.7 * scale - s.t * 0.11) + Math.sin((p.x * asp + p.y) * 2.2 * scale + s.t * 0.07)) * 1.05 +
        s.p * 1.5
      const sp = 0.07 + Math.min(0.2, Math.abs(s.vel) * 0.05)
      p.x += (Math.cos(a) * sp * s.dt) / asp
      p.y += Math.sin(a) * sp * s.dt
      p.life += s.dt
      p.pts.push(p.x * s.w, p.y * s.h)
      if (p.pts.length > LEN * 2) p.pts.splice(0, 2)
      if (p.x < -0.05 || p.x > 1.05 || p.y < -0.05 || p.y > 1.05 || p.life > 14) {
        p.x = rand()
        p.y = rand()
        p.pts.length = 0
        p.life = 0
      }
      const m = p.pts.length / 2
      if (m < 4) continue
      for (let part = 0; part < 3; part++) {
        const from = Math.floor((m * part) / 3)
        const to = Math.min(m - 1, Math.floor((m * (part + 1)) / 3) + 1)
        c.beginPath()
        c.moveTo(p.pts[from * 2], p.pts[from * 2 + 1])
        for (let i = from + 1; i <= to; i++) c.lineTo(p.pts[i * 2], p.pts[i * 2 + 1])
        const al = 0.05 + 0.17 * ((part + 1) / 3) * Math.sin(Math.PI * clamp(p.life / 14))
        c.strokeStyle = p.hot ? `rgba(255,150,40,${(al * 2).toFixed(3)})` : `rgba(255,255,255,${al.toFixed(3)})`
        c.stroke()
      }
    }
  }
}

// Light shaft: slanting beams of window light with dust turning in them. The calm one.
function shaft({ beams = 3, motes = 1 }, rand, light) {
  const bs = Array.from({ length: beams }, (_, i) => ({ x: 0.08 + i * (0.8 / beams) + rand() * 0.08, wid: 0.07 + rand() * 0.08, ph: rand() * TAU, al: 0.05 + rand() * 0.05 }))
  const ms = Array.from({ length: Math.round((light ? 36 : 80) * motes) }, () => ({ x: rand(), y: rand(), z: 0.3 + rand() * 0.7, ph: rand() * TAU, hot: rand() < 0.3 }))
  return (c, s) => {
    const dx = s.h * (0.42 + s.mx * 0.05 + s.p * 0.1)
    for (const b of bs) {
      const top = (b.x + Math.sin(s.t * 0.12 + b.ph) * 0.03) * s.w
      const ww = b.wid * s.w
      const g = c.createLinearGradient(top, 0, top + dx, s.h)
      g.addColorStop(0, `rgba(255,170,70,${(b.al * 1.6).toFixed(3)})`)
      g.addColorStop(1, 'rgba(255,170,70,0)')
      c.fillStyle = g
      c.beginPath()
      c.moveTo(top, 0)
      c.lineTo(top + ww, 0)
      c.lineTo(top + dx + ww * 2.2, s.h)
      c.lineTo(top + dx, s.h)
      c.closePath()
      c.fill()
    }
    for (const m of ms) {
      m.y = (m.y + s.dt * 0.006 * m.z + 1) % 1
      m.x = (m.x + s.dt * 0.004 * m.z + 1) % 1
      const a = (0.12 + 0.4 * (0.5 + 0.5 * Math.sin(s.t * 0.8 + m.ph))) * m.z
      c.fillStyle = m.hot ? `rgba(255,170,70,${a.toFixed(3)})` : `rgba(255,255,255,${(a * 0.8).toFixed(3)})`
      c.beginPath()
      c.arc(m.x * s.w + Math.sin(s.t * 0.3 + m.ph) * 10, m.y * s.h, 0.8 + 1.6 * m.z, 0, TAU)
      c.fill()
    }
  }
}

// A lodge at night: a grid of windows that switch on and off. Windows near the pointer light up.
function windows({ lit = 0.14, amber = 0.5 }, rand, light) {
  let cells = []
  let cols = 0
  let cw = 0
  let ch = 0
  let bw = 0
  let bh = 0
  return (c, s) => {
    if (s.w !== bw || s.h !== bh) {
      bw = s.w
      bh = s.h
      cw = s.w < 700 ? 34 : 52
      ch = cw * 1.25
      cols = Math.ceil(s.w / cw) + 1
      const rows = Math.ceil(s.h / ch) + 2
      cells = Array.from({ length: cols * rows }, () => ({ v: 0, tgt: rand() < lit ? 1 : 0, next: rand() * 8, hot: rand() < amber }))
    }
    const y0 = -ch + ((s.p * ch * 3) % ch)
    const px = (s.mx * 0.5 + 0.5) * s.w
    const py = (s.my * 0.5 + 0.5) * s.h
    c.lineWidth = 1
    cells.forEach((q, i) => {
      q.next -= s.dt
      if (q.next <= 0) {
        q.tgt = rand() < lit ? 1 : 0
        q.next = 2 + rand() * 8
      }
      q.v += (q.tgt - q.v) * Math.min(1, s.dt * 1.6)
      const x = (i % cols) * cw + 6
      const y = y0 + Math.floor(i / cols) * ch + 7
      const near = clamp(1 - Math.hypot(x + cw / 2 - px, y + ch / 2 - py) / (light ? 0 : 190))
      const v = Math.max(q.v, near * 0.9)
      c.strokeStyle = 'rgba(255,255,255,0.045)'
      c.strokeRect(x, y, cw - 12, ch - 14)
      if (v > 0.02) {
        c.fillStyle = q.hot || near > 0.3 ? `rgba(255,150,40,${(v * 0.24).toFixed(3)})` : `rgba(255,255,255,${(v * 0.12).toFixed(3)})`
        c.fillRect(x, y, cw - 12, ch - 14)
      }
    })
  }
}

// Process: three threads across the page. The middle one has five stops that light as you scroll.
function threads(_cfg, rand) {
  const ths = Array.from({ length: 3 }, (_, i) => ({ y: 0.34 + i * 0.16, a: 0.05 + rand() * 0.05, k: 1.2 + rand(), ph: rand() * TAU }))
  return (c, s) => {
    const yAt = (th, x) => (th.y + Math.sin((x / s.w) * TAU * th.k * 0.5 + s.t * 0.15 + th.ph) * th.a) * s.h
    const pp = clamp(s.p * 0.8 + 0.2 + 0.2 * Math.sin(s.t * 0.3))
    ths.forEach((th, idx) => {
      c.lineWidth = 1
      c.strokeStyle = `rgba(255,255,255,${idx === 1 ? 0.14 : 0.08})`
      c.beginPath()
      for (let x = 0; x <= s.w + 14; x += 14) {
        if (x === 0) c.moveTo(x, yAt(th, x))
        else c.lineTo(x, yAt(th, x))
      }
      c.stroke()
      if (idx === 1) {
        c.lineWidth = 1.8
        c.strokeStyle = 'rgba(255,150,40,0.5)'
        c.beginPath()
        for (let x = 0; x <= s.w * pp; x += 14) {
          if (x === 0) c.moveTo(x, yAt(th, x))
          else c.lineTo(x, yAt(th, x))
        }
        c.stroke()
      }
      const cx = ((s.t * 0.06 + idx * 0.31) % 1) * s.w
      c.fillStyle = 'rgba(255,190,100,0.85)'
      c.beginPath()
      c.arc(cx, yAt(th, cx), 2.2, 0, TAU)
      c.fill()
    })
    for (let i = 0; i < 5; i++) {
      const x = (0.1 + 0.2 * i) * s.w
      const y = yAt(ths[1], x)
      const on = pp >= i / 4 - 0.02
      if (on) {
        c.fillStyle = 'rgba(255,130,0,0.12)'
        c.beginPath()
        c.arc(x, y, 22, 0, TAU)
        c.fill()
      }
      c.lineWidth = 1
      c.strokeStyle = on ? 'rgba(255,170,60,0.8)' : 'rgba(255,255,255,0.2)'
      c.fillStyle = on ? 'rgba(255,150,40,0.9)' : 'rgba(0,0,0,0)'
      c.beginPath()
      c.arc(x, y, 6, 0, TAU)
      c.fill()
      c.stroke()
    }
  }
}

// Footer: a brass pendant lamp that swings toward the pointer, a cone of light with dust in it,
// and embers lifting off the bottom edge.
function lamp(_cfg, rand, light) {
  const dust = Array.from({ length: light ? 24 : 48 }, () => ({ u: rand() * 2 - 1, y: rand(), z: 0.3 + rand() * 0.7, ph: rand() * TAU }))
  const embers = Array.from({ length: light ? 10 : 22 }, () => ({ x: rand(), y: rand(), z: 0.3 + rand() * 0.7, ph: rand() * TAU }))
  let ang = 0
  let vang = 0
  return (c, s) => {
    const wide = s.w > 900
    const px = wide ? s.w * 0.86 : s.w * 0.5
    const len = Math.min(s.h * 0.12, 90) + 40
    const target = s.mx * (wide ? 0.25 : 0.12) + Math.sin(s.t * 0.8) * 0.05
    vang += ((target - ang) * 6 - vang * 1.2) * s.dt
    ang += vang * s.dt
    const lx = px + Math.sin(ang) * len
    const ly = Math.cos(ang) * len
    const floor = s.h * 0.92
    const half = Math.min(s.w * 0.3, 360)
    const bx = lx + Math.sin(ang) * (floor - ly) * 0.5

    const g = c.createLinearGradient(0, ly, 0, floor)
    g.addColorStop(0, 'rgba(255,170,60,0.2)')
    g.addColorStop(1, 'rgba(255,170,60,0)')
    c.fillStyle = g
    c.beginPath()
    c.moveTo(lx - 34, ly + 10)
    c.lineTo(lx + 34, ly + 10)
    c.lineTo(bx + half, floor)
    c.lineTo(bx - half, floor)
    c.closePath()
    c.fill()

    c.lineWidth = 1
    c.strokeStyle = 'rgba(255,255,255,0.2)'
    c.beginPath()
    c.moveTo(px, 0)
    c.lineTo(lx, ly - 22)
    c.stroke()
    c.save()
    c.translate(lx, ly)
    c.rotate(ang)
    c.fillStyle = 'rgba(255,130,0,0.25)'
    c.strokeStyle = 'rgba(255,170,60,0.7)'
    c.beginPath()
    c.moveTo(-13, -22)
    c.lineTo(13, -22)
    c.lineTo(38, 10)
    c.lineTo(-38, 10)
    c.closePath()
    c.fill()
    c.stroke()
    c.restore()
    const glow = c.createRadialGradient(lx, ly + 14, 0, lx, ly + 14, 110)
    glow.addColorStop(0, 'rgba(255,190,100,0.4)')
    glow.addColorStop(1, 'rgba(255,150,40,0)')
    c.fillStyle = glow
    c.beginPath()
    c.arc(lx, ly + 14, 110, 0, TAU)
    c.fill()

    for (const d of dust) {
      d.y = (d.y + s.dt * 0.01 * d.z) % 1
      const cx = lerp(lx, bx, d.y)
      const hw = lerp(34, half, d.y)
      const a = 0.55 * (1 - d.y) * (0.4 + 0.6 * Math.sin(s.t * 0.9 + d.ph) ** 2) * d.z
      c.fillStyle = `rgba(255,210,150,${a.toFixed(3)})`
      c.beginPath()
      c.arc(cx + (d.u + Math.sin(s.t * 0.2 + d.ph) * 0.08) * hw * 0.9, lerp(ly + 10, floor, d.y), 1 + 1.4 * d.z, 0, TAU)
      c.fill()
    }
    for (const e of embers) {
      e.y -= s.dt * (0.02 + 0.03 * e.z)
      if (e.y < 0.35) {
        e.y = 1.02
        e.x = rand()
      }
      const a = (0.25 + 0.45 * Math.sin(s.t * 3 + e.ph) ** 2) * e.z * clamp((1 - e.y) * 3 + 0.2)
      c.fillStyle = `rgba(255,150,40,${a.toFixed(3)})`
      c.beginPath()
      c.arc((e.x + Math.sin(s.t * 0.5 + e.ph) * 0.015) * s.w, e.y * s.h, 1 + 1.6 * e.z, 0, TAU)
      c.fill()
    }
  }
}

export const MODES = { bokeh, ribbons, flow, shaft, windows, threads, lamp }
