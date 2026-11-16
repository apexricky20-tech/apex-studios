import test from 'node:test'
import assert from 'node:assert/strict'
import { timeline, nodeT, SCALE, GROW_END, DIP_END } from '../src/lib/bloom.js'

const steps = (n) => Array.from({ length: n + 1 }, (_, i) => i / n)
const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} vs ${b}`)

test('starts at the original size with every service tucked in', () => {
  const t = timeline(0, 0)
  close(t.p, 0)
  close(t.scale, SCALE.rest)
})

test('grows to the peak while every service is still inside', () => {
  let prev = SCALE.rest
  for (const m of steps(50).filter((m) => m <= GROW_END)) {
    const t = timeline(m, 0)
    assert.equal(t.p, 0)
    assert.ok(t.scale >= prev - 1e-12, 'grow must be monotonic')
    prev = t.scale
  }
  close(timeline(GROW_END, 0).scale, SCALE.peak)
})

test('dips slightly BEFORE any service leaves', () => {
  const t = timeline(DIP_END, 0)
  assert.equal(t.p, 0, 'nothing has left yet when the dip finishes')
  close(t.scale, SCALE.dip)
  assert.ok(t.scale < SCALE.peak && t.scale > SCALE.rest)
  assert.ok(timeline(DIP_END + 0.05, 0).p > 0, 'services start leaving right after the dip')
})

test('services all land on the ring and the blob settles smaller', () => {
  const t = timeline(1, 0)
  close(t.p, 1)
  close(t.scale, SCALE.ring)
  assert.ok(SCALE.ring < SCALE.rest)
})

test('enter: p never goes down, services leave in a fixed order', () => {
  let prev = -1
  for (const m of steps(200)) {
    const { p } = timeline(m, 0)
    assert.ok(p >= prev - 1e-12)
    prev = p
  }
})

test('exit: services slide back in and the blob returns to its original size', () => {
  const end = timeline(1, 1)
  close(end.p, 0)
  close(end.scale, SCALE.rest)
  for (let i = 0; i < 12; i++) assert.equal(nodeT(i, 12, end.p), 0)
})

test('exit is monotonic: p only falls, scale only rises back to 1', () => {
  let prev = timeline(1, 0)
  for (const x of steps(100)) {
    const t = timeline(1, x)
    assert.ok(t.p <= prev.p + 1e-12)
    assert.ok(t.scale >= prev.scale - 1e-12)
    prev = t
  }
})

test('exit retracts the last service first (true reverse of the stagger)', () => {
  const n = 12
  const firstOutAt = (i) => steps(400).find((p) => nodeT(i, n, p) >= 1)
  const firstInAt = (i) => [...steps(400)].reverse().find((p) => nodeT(i, n, p) < 1)
  assert.ok(firstOutAt(0) < firstOutAt(n - 1), 'service 0 leaves first')
  assert.ok(firstInAt(n - 1) > firstInAt(0), 'service 11 starts coming back first')
})

test('scrubbing is reversible: same scroll position, same frame, either direction', () => {
  const down = steps(120).map((m) => timeline(m, 0))
  const up = steps(120).reverse().map((m) => timeline(m, 0)).reverse()
  assert.deepEqual(up, down)
})

test('out-of-range scroll values are clamped', () => {
  assert.deepEqual(timeline(-3, -3), timeline(0, 0))
  assert.deepEqual(timeline(7, 9), timeline(1, 1))
})
