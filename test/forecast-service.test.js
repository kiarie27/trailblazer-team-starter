// Tests for the practice card's service module.
// They never touch the network: each test passes in a pretend fetch.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { getForecast } from '../practice/forecast-service.js'

// A real Open-Meteo answer for Nairobi, saved on 11 Nov 2026
const sample = JSON.parse(await readFile(new URL('../data/forecast-sample.json', import.meta.url), 'utf8'))

// A pretend fetch that always answers with the saved forecast
function fetchSavedForecast(url) {
  fetchSavedForecast.lastUrl = url
  return Promise.resolve(new Response(JSON.stringify(sample), { status: 200 }))
}

test('a known town gives one object per day', async () => {
  const result = await getForecast('Nairobi', 7, fetchSavedForecast)

  assert.equal(result.ok, true)
  assert.equal(result.data.length, 7)
  assert.deepEqual(result.data[0], { date: '2026-11-11', maxC: 27.4, minC: 15, rainMm: 10.9 })
  assert.match(fetchSavedForecast.lastUrl, /latitude=-1\.2833&longitude=36\.8167/)
  assert.match(fetchSavedForecast.lastUrl, /forecast_days=7/)
})

test('an unknown town gives UNKNOWN_TOWN and asks no server', async () => {
  let asked = false
  const fetchFn = () => {
    asked = true
  }

  const result = await getForecast('Atlantis', 3, fetchFn)

  assert.equal(result.ok, false)
  assert.equal(result.error.code, 'UNKNOWN_TOWN')
  assert.equal(asked, false)
})

test('a dropped connection gives NETWORK', async () => {
  const fetchFn = () => Promise.reject(new TypeError('Failed to fetch'))

  const result = await getForecast('Kisumu', 3, fetchFn)

  assert.equal(result.ok, false)
  assert.equal(result.error.code, 'NETWORK')
})

test('a server error gives BAD_RESPONSE', async () => {
  const fetchFn = () => Promise.resolve(new Response('Server error', { status: 500 }))

  const result = await getForecast('Mombasa', 3, fetchFn)

  assert.equal(result.ok, false)
  assert.equal(result.error.code, 'BAD_RESPONSE')
  assert.match(result.error.message, /500/)
})

test('an answer without a daily forecast gives BAD_RESPONSE', async () => {
  const fetchFn = () => Promise.resolve(new Response(JSON.stringify({ hello: 'world' }), { status: 200 }))

  const result = await getForecast('Nakuru', 3, fetchFn)

  assert.equal(result.ok, false)
  assert.equal(result.error.code, 'BAD_RESPONSE')
})

// DAY 4: turn this to-do into a real test when you add the rule
test.todo('days outside 1 to 7 give DAYS_OUT_OF_RANGE and ask no server')
