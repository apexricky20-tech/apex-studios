import test from 'node:test'
import assert from 'node:assert/strict'
import { FIELDS, fieldFor, seeded } from '../src/lib/fields.js'
import { MODES } from '../src/components/fields/modes.js'

test('home keeps its own background', () => {
  assert.equal(fieldFor('/'), null)
})

test('every inner page resolves to a real field kind', () => {
  for (const path of ['/work', '/work/bullhead', '/services', '/process', '/about', '/contact', '/articles/x', '/nope']) {
    const f = fieldFor(path)
    assert.ok(f && MODES[f.mode], path)
  }
  for (const [id, f] of Object.entries(FIELDS)) assert.ok(MODES[f.mode], id)
})

test('seeded is stable per page and differs between pages', () => {
  assert.equal(seeded('work')(), seeded('work')())
  assert.notEqual(seeded('work')(), seeded('about')())
})

test('every kind draws a few frames without throwing', () => {
  const noop = () => undefined
  const ctx = new Proxy({}, { get: (_t, k) => (k === 'createLinearGradient' || k === 'createRadialGradient' ? () => ({ addColorStop: noop }) : noop), set: () => true })
  for (const [name, make] of Object.entries(MODES)) {
    for (const light of [true, false]) {
      const draw = make({}, seeded(name), light)
      for (let i = 0; i < 40; i++) draw(ctx, { w: i % 2 ? 390 : 1440, h: 800, t: i / 30, dt: 1 / 30, p: i / 40, vel: 0.5, mx: 0.3, my: -0.2 })
    }
  }
})
