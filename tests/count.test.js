import test from 'node:test'
import assert from 'node:assert/strict'
import { formatCount, splitNumbers } from '../src/lib/count.js'

const nums = (t) => splitNumbers(t).filter((p) => p.to !== undefined).map((p) => p.to)
const rebuilt = (t) => splitNumbers(t).map((p) => p.text).join('')

test('counts the real figures and leaves branch numbers alone', () => {
  assert.deepEqual(nums('Branch 1: 106 · Branch 2: 86 · 192 combined'), [106, 86, 192])
})

test('a single figure with words around it', () => {
  assert.deepEqual(nums('169 customer interactions'), [169])
})

test('years, times, 24/7 and 3D are never counted', () => {
  for (const t of ['Since 2026', 'Opens 10:30', 'Open 24/7', 'a 3D tour', '48h delivery']) assert.deepEqual(nums(t), [], t)
})

test('thousands separators and decimals survive', () => {
  assert.deepEqual(nums('1,200 orders'), [1200])
  assert.equal(formatCount(1200, { comma: true }), '1,200')
  assert.equal(formatCount(12.5, { decimals: 1 }), '12.5')
  assert.equal(formatCount(168.6), '169')
})

test('the pieces always join back into the original text', () => {
  for (const t of ['Branch 1: 106 · Branch 2: 86 · 192 combined', '169 customer interactions', 'no numbers here', '']) {
    assert.equal(rebuilt(t), t)
  }
})
