import { FX, calm, fine } from './fx.js'
import { emberRate, heroProgress, isStruggling, marqueeRate, progressOf, SLOW_FRAME } from './stagemath.js'

// Stage = the choreography layer. One scroll loop drives everything, and it sleeps when nothing moves.
// Rules this file lives by:
//  1. It only ever adds attributes, CSS variables and its own elements. It never rewrites text or
//     React's markup, so it cannot break what React renders.
//  2. Each feature starts inside its own try/catch. If one fails, the others and the site carry on.
//  3. Everything it starts, it stops again in destroy(). Nothing leaks across page changes.
//  4. It measures itself. If the device cannot keep up, it switches the heavy parts off (data-stage-lite).

const OFF_KEY = 'apex-fx'
const LITE_KEY = 'apex-fx-lite'

const dev = () => typeof import.meta !== 'undefined' && import.meta.env?.DEV

function read(storage, key) {
  try {
    return window[storage].getItem(key)
  } catch {
    return null
  }
}
function write(storage, key, value) {
  try {
    if (value === null) window[storage].removeItem(key)
    else window[storage].setItem(key, value)
  } catch {
    /* private mode or blocked storage: ignore */
  }
}

// ?fx=off switches Stage off for this browser until ?fx=on. Handy if something ever misbehaves in production.
function killed() {
  const q = new URLSearchParams(window.location.search).get('fx')
  if (q === 'off') write('localStorage', OFF_KEY, 'off')
  if (q === 'on') write('localStorage', OFF_KEY, null)
  return q === 'off' || read('localStorage', OFF_KEY) === 'off'
}

// 0 = nothing runs, 1 = lite (phones, older devices, or this session already proved too slow), 2 = full.
export function stageTier() {
  if (typeof window === 'undefined' || !FX.stage) return 0
  if (calm() || killed()) return 0
  const nav = navigator
  const conn = nav.connection
  if (conn?.saveData || /(^|-)2g$/.test(conn?.effectiveType || '')) return 0
  const light =
    window.innerWidth < 768 || !fine() || (nav.deviceMemory ?? 8) <= 4 || (nav.hardwareConcurrency ?? 8) <= 4
  return light || read('sessionStorage', LITE_KEY) ? 1 : 2
}

// ---------------------------------------------------------------------------------------------
// Scroll progress: any element with data-scrollp gets a --p variable from 0 to 1 as it crosses the
// screen. Only elements near the screen are measured, reads are batched before writes.
function makeProgress() {
  const near = new Set()
  const known = new Set()
  const last = new WeakMap()
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) near.add(e.target)
        else near.delete(e.target)
      }
    },
    { rootMargin: '25% 0px 25% 0px' },
  )
  return {
    scan() {
      for (const el of known) {
        if (!el.isConnected) {
          io.unobserve(el)
          known.delete(el)
          near.delete(el)
        }
      }
      document.querySelectorAll('[data-scrollp]').forEach((el) => {
        if (!known.has(el)) {
          known.add(el)
          io.observe(el)
        }
      })
    },
    update() {
      const vh = window.innerHeight
      const reads = []
      near.forEach((el) => {
        if (el.isConnected) reads.push([el, el.getBoundingClientRect()])
      })
      for (const [el, r] of reads) {
        const p = progressOf(r.top, r.height, vh)
        if (Math.abs(p - (last.get(el) ?? -1)) > 0.002) {
          last.set(el, p)
          el.style.setProperty('--p', p.toFixed(4))
        }
      }
    },
    destroy() {
      io.disconnect()
      known.forEach((el) => el.style.removeProperty('--p'))
      known.clear()
      near.clear()
    },
  }
}

// The hero portrait is a camera moving into the room: --hp goes 0 to 1 over the first screen of scrolling.
function makeHero() {
  let stage = null
  let lastP = -1
  return {
    update(y) {
      if (!stage || !stage.isConnected) {
        stage = document.querySelector('[data-hero-stage]')
        lastP = -1
      }
      if (!stage) return
      const p = Math.round(heroProgress(y, window.innerHeight) * 500) / 500
      if (p === lastP) return
      lastP = p
      stage.style.setProperty('--hp', String(p))
    },
    destroy() {
      stage?.style.removeProperty('--hp')
    },
  }
}

// The marquee ticker reads your scroll speed: faster scrolling pulls it faster, scrolling back eases it.
// The rate is never zero or negative (see marqueeRate).
function makeMarquee() {
  let list = []
  let applied = 1
  const refresh = () => {
    list = document.getAnimations().filter((a) => a.animationName === 'marquee')
  }
  return {
    refresh,
    set(rate) {
      if (Math.abs(rate - applied) < 0.01) return
      applied = rate
      for (const a of list) a.playbackRate = rate
    },
    destroy() {
      for (const a of list) a.playbackRate = 1
    },
  }
}

// Embers: a small 2D canvas. Spawns only while you scroll, draws only while embers are alive, then sleeps.
function makeEmbers(canvas) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  const sprite = document.createElement('canvas')
  sprite.width = sprite.height = 32
  const sg = sprite.getContext('2d')
  const g = sg.createRadialGradient(16, 16, 0, 16, 16, 16)
  g.addColorStop(0, 'rgba(255,238,205,1)')
  g.addColorStop(0.25, 'rgba(255,150,30,0.85)')
  g.addColorStop(1, 'rgba(255,130,0,0)')
  sg.fillStyle = g
  sg.fillRect(0, 0, 32, 32)

  const parts = []
  let w = 0
  let h = 0
  let raf = 0
  let last = 0
  let acc = 0
  const size = () => {
    w = canvas.width = window.innerWidth
    h = canvas.height = window.innerHeight
  }
  size()

  const frame = (t) => {
    raf = 0
    const dt = Math.min(0.05, (t - last) / 1000 || 0.016)
    last = t
    ctx.clearRect(0, 0, w, h)
    ctx.globalCompositeOperation = 'lighter'
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i]
      p.age = (t - p.born) / 1000 // wall-clock age: a slow device can never keep embers alive longer than their life
      if (p.age >= p.life) {
        parts.splice(i, 1)
        continue
      }
      p.x += (p.vx + Math.sin(p.age * p.sw + p.ph) * 18) * dt
      p.y += p.vy * dt
      const k = p.age / p.life
      ctx.globalAlpha = (k < 0.15 ? k / 0.15 : 1 - (k - 0.15) / 0.85) * p.a
      const s = p.s * (1 - k * 0.5)
      ctx.drawImage(sprite, p.x - s / 2, p.y - s / 2, s, s)
    }
    if (parts.length) raf = requestAnimationFrame(frame)
    else ctx.clearRect(0, 0, w, h)
  }

  return {
    feed(vel, dtSeconds) {
      if (document.hidden) return
      acc = Math.min(3, acc + emberRate(vel) * dtSeconds)
      const lift = 1 + Math.min(1, Math.abs(vel) / 1500)
      while (acc >= 1 && parts.length < 70) {
        acc -= 1
        parts.push({
          x: Math.random() * w,
          y: h + 10,
          vx: (Math.random() - 0.5) * 30,
          vy: -(70 + Math.random() * 140) * lift,
          age: 0,
          born: performance.now(),
          life: 2.2 + Math.random() * 2,
          s: 10 + Math.random() * 22,
          a: 0.35 + Math.random() * 0.5,
          sw: 1 + Math.random() * 2,
          ph: Math.random() * 6.28,
        })
      }
      if (parts.length && !raf) {
        last = performance.now()
        raf = requestAnimationFrame(frame)
      }
    },
    resize: size,
    stop() {
      cancelAnimationFrame(raf)
      raf = 0
      parts.length = 0
      ctx.clearRect(0, 0, w, h)
    },
  }
}

// 'Step inside': a bubble that follows the mouse over any element with data-cursor="label".
// The real cursor is only hidden while the bubble is actually showing.
function startCursor(el) {
  const root = document.documentElement
  const label = el.firstElementChild
  const t = { x: -200, y: -200 }
  const c = { x: -200, y: -200 }
  let raf = 0
  let host = null

  const loop = () => {
    c.x += (t.x - c.x) * 0.22
    c.y += (t.y - c.y) * 0.22
    el.style.transform = `translate3d(${c.x.toFixed(1)}px, ${c.y.toFixed(1)}px, 0)`
    raf = Math.abs(t.x - c.x) + Math.abs(t.y - c.y) > 0.3 ? requestAnimationFrame(loop) : 0
  }
  const hide = () => {
    host = null
    delete el.dataset.on
    root.removeAttribute('data-cursor-on')
  }
  const move = (e) => {
    if (e.pointerType && e.pointerType !== 'mouse') return
    t.x = e.clientX
    t.y = e.clientY
    const next = e.target.closest?.('[data-cursor]') ?? null
    if (next !== host) {
      if (next) {
        if (!el.dataset.on) {
          c.x = t.x
          c.y = t.y
        }
        label.textContent = next.dataset.cursor
        el.dataset.on = '1'
        root.setAttribute('data-cursor-on', '')
        host = next
      } else hide()
    }
    if (host && !raf) raf = requestAnimationFrame(loop)
  }
  const onHidden = () => {
    if (document.hidden) hide()
  }
  window.addEventListener('pointermove', move, { passive: true })
  root.addEventListener('mouseleave', hide)
  document.addEventListener('visibilitychange', onHidden)
  return () => {
    window.removeEventListener('pointermove', move)
    root.removeEventListener('mouseleave', hide)
    document.removeEventListener('visibilitychange', onHidden)
    cancelAnimationFrame(raf)
    hide()
  }
}

// The logo signs itself. Paths get pathLength=1 so the CSS can draw them; the attribute is removed
// again afterwards so nothing is left behind.
function startSignature() {
  const root = document.documentElement
  const svg = document.querySelector('header svg[viewBox="0 0 520 120"]')
  const paths = svg ? [...svg.querySelectorAll('path')] : []
  if (!paths.length) return undefined
  paths.forEach((p, i) => {
    p.setAttribute('pathLength', '1')
    p.style.setProperty('--i', String(i))
  })
  root.setAttribute('data-sign', '')
  const done = setTimeout(() => root.removeAttribute('data-sign'), 3800)
  return () => {
    clearTimeout(done)
    root.removeAttribute('data-sign')
  }
}

// Idle on the home page for a few seconds and the main button rings like a hotel service bell.
function startBell() {
  const root = document.documentElement
  let lastInput = performance.now()
  const poke = () => {
    lastInput = performance.now()
    if (root.hasAttribute('data-idle')) root.removeAttribute('data-idle')
  }
  const events = ['pointermove', 'pointerdown', 'keydown', 'scroll', 'touchstart']
  events.forEach((n) => window.addEventListener(n, poke, { passive: true }))
  const timer = setInterval(() => {
    const idle =
      !document.hidden &&
      performance.now() - lastInput > 7000 &&
      window.scrollY < 80 &&
      (window.location.pathname.replace(/\/+$/, '') || '/') === '/'
    root.toggleAttribute('data-idle', idle)
  }, 1000)
  return () => {
    events.forEach((n) => window.removeEventListener(n, poke))
    clearInterval(timer)
    root.removeAttribute('data-idle')
  }
}

// ---------------------------------------------------------------------------------------------
export function startStage({ tier, embers, cursor }) {
  const root = document.documentElement
  const undo = []
  let destroyed = false
  const guard = (name, fn) => {
    try {
      const off = fn()
      if (typeof off === 'function') undo.push(off)
      return off
    } catch (err) {
      if (dev()) console.warn(`[stage] ${name} failed`, err)
      return undefined
    }
  }

  if (read('sessionStorage', LITE_KEY)) root.setAttribute('data-stage-lite', '') // this session already proved too slow

  let prog = null
  let hero = null
  let marquee = null
  let ember = null
  guard('progress', () => {
    prog = makeProgress()
    return () => prog.destroy()
  })
  guard('hero', () => {
    hero = makeHero()
    return () => hero.destroy()
  })
  if (FX.inertia) {
    guard('marquee', () => {
      marquee = makeMarquee()
      return () => marquee.destroy()
    })
  }
  if (tier === 2 && FX.embers && embers) {
    guard('embers', () => {
      ember = makeEmbers(embers)
      return () => ember?.stop()
    })
  }
  if (tier === 2 && FX.cursorLabel && cursor && fine()) guard('cursor', () => startCursor(cursor))
  if (FX.signature) guard('signature', startSignature)
  if (FX.bell) guard('bell', startBell)

  // ---- the one scroll loop ----
  const S = { y: window.scrollY, vel: 0, rate: 1, lastScroll: 0, raf: 0, last: 0, frames: 0, slow: 0, lastScan: 0 }

  const degrade = () => {
    if (root.hasAttribute('data-stage-lite')) return
    root.setAttribute('data-stage-lite', '')
    write('sessionStorage', LITE_KEY, '1')
    ember?.stop()
    ember = null
  }

  const tick = (t) => {
    S.raf = 0
    if (destroyed) return
    const raw = S.last ? t - S.last : 16.7
    const dt = Math.min(100, raw)
    S.last = t
    const y = window.scrollY
    const inst = ((y - S.y) / Math.max(dt, 1)) * 1000
    S.y = y
    S.vel += (inst - S.vel) * 0.18

    // governor: only judge frames that happen while the page is actually scrolling
    if (Math.abs(inst) > 50 && raw < 250 && !root.hasAttribute('data-stage-lite')) {
      S.frames++
      if (raw > SLOW_FRAME) S.slow++
      if (S.frames >= 90) {
        if (isStruggling(S.slow, S.frames)) degrade()
        S.frames = 0
        S.slow = 0
      }
    }

    if (t - S.lastScan > 700) {
      S.lastScan = t
      prog?.scan()
      marquee?.refresh()
    }
    prog?.update()
    hero?.update(y)

    if (marquee) {
      S.rate += (marqueeRate(S.vel) - S.rate) * 0.12
      if (Math.abs(S.rate - 1) < 0.015 && Math.abs(S.vel) < 8) S.rate = 1
      marquee.set(S.rate)
    }
    ember?.feed(S.vel, dt / 1000)

    const moving = t - S.lastScroll < 160 || Math.abs(S.vel) > 8 || Math.abs(S.rate - 1) > 0.015
    if (moving) S.raf = requestAnimationFrame(tick)
    else {
      S.vel = 0
      S.last = 0
    }
  }
  const wake = () => {
    S.lastScroll = performance.now()
    if (!S.raf && !destroyed) S.raf = requestAnimationFrame(tick)
  }
  const onResize = () => {
    ember?.resize()
    wake()
  }
  window.addEventListener('scroll', wake, { passive: true })
  window.addEventListener('resize', onResize)
  undo.push(() => {
    window.removeEventListener('scroll', wake)
    window.removeEventListener('resize', onResize)
    cancelAnimationFrame(S.raf)
  })

  // first measurements, and again as lazy pages and content arrive
  const scanAt = [0, 120, 500, 1400, 3500].map((ms) =>
    setTimeout(() => {
      prog?.scan()
      marquee?.refresh()
      prog?.update()
      hero?.update(window.scrollY)
    }, ms),
  )
  undo.push(() => scanAt.forEach(clearTimeout))

  return {
    // call after a page change
    rescan() {
      ;[0, 150, 600, 1500, 3500].forEach((ms) =>
        scanAt.push(
          setTimeout(() => {
            if (destroyed) return
            prog?.scan()
            marquee?.refresh()
            prog?.update()
            hero?.update(window.scrollY)
          }, ms),
        ),
      )
    },
    destroy() {
      destroyed = true
      undo.splice(0).reverse().forEach((fn) => {
        try {
          fn()
        } catch {
          /* already gone */
        }
      })
    },
  }
}
