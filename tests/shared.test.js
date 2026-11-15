import test from 'node:test'
import assert from 'node:assert/strict'
import { bump, safeEqual, sameOrigin, hmac, isAuthed, SESSION_MS } from '../functions/_lib/shared.js'

const kv = (over = {}) => {
  const m = new Map()
  return { get: async (k) => m.get(k) ?? null, put: async (k, v) => void m.set(k, v), ...over }
}

test('bump allows up to the limit, then refuses', async () => {
  const env = { DB: kv() }
  for (let i = 0; i < 3; i++) assert.equal(await bump(env, 'k', 3, 60), true)
  assert.equal(await bump(env, 'k', 3, 60), false)
})

test('bump fails OPEN when KV writes are exhausted, so real enquiries are not lost', async () => {
  const env = { DB: kv({ put: async () => { throw new Error('KV put() limit exceeded for the day.') } }) }
  assert.equal(await bump(env, 'k', 3, 60), true)
})

test('bump fails CLOSED for the admin login when asked', async () => {
  const env = { DB: kv({ get: async () => { throw new Error('down') } }) }
  assert.equal(await bump(env, 'k', 3, 60, { failClosed: true }), false)
})

test('safeEqual compares strings without early exit', () => {
  assert.equal(safeEqual('abc', 'abc'), true)
  assert.equal(safeEqual('abc', 'abd'), false)
  assert.equal(safeEqual('abc', 'abcd'), false)
})

test('sameOrigin accepts same host and rejects others', () => {
  const url = new URL('https://x.test/api/contact')
  const req = (o) => ({ headers: { get: () => o } })
  assert.equal(sameOrigin(req(null), url), true)
  assert.equal(sameOrigin(req('https://x.test'), url), true)
  assert.equal(sameOrigin(req('https://evil.test'), url), false)
  assert.equal(sameOrigin(req('not a url'), url), false)
})

test('isAuthed accepts a valid session and rejects a forged or revoked one', async () => {
  const secret = 's3cret'
  const exp = Date.now() + SESSION_MS
  const sig = await hmac(secret, String(exp))
  const req = (cookie) => ({ headers: { get: () => cookie } })
  const env = { SESSION_SECRET: secret, DB: kv() }
  assert.equal(await isAuthed(req(`__Host-session=${exp}.${sig}`), env), true)
  assert.equal(await isAuthed(req(`__Host-session=${exp}.deadbeef`), env), false)
  const revoked = { SESSION_SECRET: secret, DB: kv({ get: async () => String(Date.now() + 1000) }) }
  assert.equal(await isAuthed(req(`__Host-session=${exp}.${sig}`), revoked), false)
})
