import test from 'node:test'
import assert from 'node:assert/strict'
import { isPageSpeed, parseScores } from '../src/lib/scores.js'

test('parseScores reads the four PageSpeed scores from the result line', () => {
  const s = parseScores('Performance 100 · Accessibility 96 · Best Practices 92 · SEO 100')
  assert.deepEqual(
    s.map((x) => [x.label, x.value]),
    [['Performance', 100], ['Accessibility', 96], ['Best Practices', 92], ['SEO', 100]],
  )
})

test('parseScores copes with colons, case and a missing score, but needs at least three', () => {
  assert.equal(parseScores('performance: 98, accessibility: 91, seo: 100').length, 3)
  assert.equal(parseScores('Performance 100 · SEO 100').length, 0)
  assert.equal(parseScores('Branch 1: 106 · Branch 2: 86 · 192 combined').length, 0)
})

test('parseScores ignores impossible values, duplicates and non-strings', () => {
  assert.equal(parseScores('Performance 100 · Accessibility 96 · SEO 100 · SEO 7').length, 3)
  assert.equal(parseScores('Performance 100 · Accessibility 960 · SEO 100').length, 0)
  assert.deepEqual(parseScores(undefined), [])
  assert.deepEqual(parseScores(42), [])
})

test('isPageSpeed matches the card label', () => {
  assert.equal(isPageSpeed('PageSpeed Insights, mobile'), true)
  assert.equal(isPageSpeed('Google Business Profile interactions, last 28 days'), false)
  assert.equal(isPageSpeed(undefined), false)
})
