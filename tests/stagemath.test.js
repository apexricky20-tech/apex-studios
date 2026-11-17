import test from 'node:test'
import assert from 'node:assert/strict'
import { clamp, emberRate, heroProgress, isStruggling, marqueeRate, progressOf } from '../src/lib/stagemath.js'

test('clamp holds a value inside its bounds', () => {
  assert.equal(clamp(-3), 0)
  assert.equal(clamp(0.4), 0.4)
  assert.equal(clamp(9), 1)
  assert.equal(clamp(5, 2, 4), 4)
})

test('progressOf runs 0 to 1 as an element crosses the screen', () => {
  const vh = 800
  assert.equal(progressOf(800, 400, vh), 0) // just entering at the bottom
  assert.equal(progressOf(-400, 400, vh), 1) // just left at the top
  assert.ok(Math.abs(progressOf(200, 400, vh) - 0.5) < 1e-9) // halfway
  assert.equal(progressOf(5000, 400, vh), 0) // far below
  assert.equal(progressOf(-5000, 400, vh), 1) // far above
  assert.equal(progressOf(0, 0, 0), 0) // degenerate sizes never produce NaN
})

test('heroProgress is 0 at the top and 1 a screen down', () => {
  assert.equal(heroProgress(0, 900), 0)
  assert.equal(heroProgress(450, 900), 0.5)
  assert.equal(heroProgress(9000, 900), 1)
  assert.equal(heroProgress(10, 0), 0)
})

test('marqueeRate speeds up going down, eases going up, and is never zero or negative', () => {
  assert.equal(marqueeRate(0), 1)
  assert.ok(marqueeRate(1200) > 2.9 && marqueeRate(1200) < 3.1)
  assert.equal(marqueeRate(1e9), 6) // capped
  assert.ok(marqueeRate(-800) < 1 && marqueeRate(-800) > 0.4)
  assert.equal(marqueeRate(-1e9), 0.25) // floor: a backwards CSS animation from t=0 would go blank
  assert.equal(marqueeRate(NaN), 1)
  assert.equal(marqueeRate(Infinity), 1)
  for (let v = -50000; v <= 50000; v += 777) assert.ok(marqueeRate(v) >= 0.25 && marqueeRate(v) <= 6)
})

test('emberRate is silent at rest, capped, and gentler when scrolling up', () => {
  assert.equal(emberRate(0), 0)
  assert.equal(emberRate(1e9), 70)
  assert.equal(emberRate(-1e9), 35)
  assert.equal(emberRate(NaN), 0)
  assert.ok(emberRate(500) > 0 && emberRate(500) < 70)
})

test('isStruggling needs enough frames and a clear majority of slow ones', () => {
  assert.equal(isStruggling(50, 60), false) // not enough frames yet
  assert.equal(isStruggling(10, 90), false)
  assert.equal(isStruggling(32, 90), true)
  assert.equal(isStruggling(31, 90), false) // exactly under a third+
})
