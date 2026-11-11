// Tests for your team's service module. Add a test for every rule you write.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { getItems } from '../src/service.js'

const sampleItems = await readFile(new URL('../data/sample-items.json', import.meta.url), 'utf8')

test('getItems gives the list of items', async () => {
  const fetchFn = () => Promise.resolve(new Response(sampleItems, { status: 200 }))

  const result = await getItems(fetchFn)

  assert.equal(result.ok, true)
  assert.equal(result.data.length, 3)
  assert.equal(result.data[0].title, 'Saturday clean-up')
})

test('getItems gives BAD_RESPONSE when the file is missing', async () => {
  const fetchFn = () => Promise.resolve(new Response('Not found', { status: 404 }))

  const result = await getItems(fetchFn)

  assert.equal(result.ok, false)
  assert.equal(result.error.code, 'BAD_RESPONSE')
  assert.match(result.error.message, /404/)
})

test('getItems gives BAD_RESPONSE when the file has no items list', async () => {
  const fetchFn = () => Promise.resolve(new Response(JSON.stringify({ things: [] }), { status: 200 }))

  const result = await getItems(fetchFn)

  assert.equal(result.ok, false)
  assert.equal(result.error.code, 'BAD_RESPONSE')
})

test('getItems gives BAD_RESPONSE when the connection drops', async () => {
  const fetchFn = () => Promise.reject(new TypeError('Failed to fetch'))

  const result = await getItems(fetchFn)

  assert.equal(result.ok, false)
  assert.equal(result.error.code, 'BAD_RESPONSE')
})

// DAY 4: add tests for your own function here
