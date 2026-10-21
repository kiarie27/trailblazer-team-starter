// Tests for the Moringa Pesa Sandbox. Run them with: npm test
//
// Each test sends a real request to a copy of the sandbox and checks the answer.
// Before every test the sandbox is reset, so one test cannot change another.

import { test, before, after, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { once } from 'node:events'
import { createApp } from '../sandbox/app.js'

let server
let base

// Start a copy of the sandbox on a free port before the tests, and stop it after
before(async () => {
  server = createApp().listen(0)
  await once(server, 'listening')
  base = `http://localhost:${server.address().port}`
})

after(() => {
  server.closeAllConnections()
  server.close()
})

beforeEach(async () => {
  await fetch(`${base}/reset`, { method: 'POST' })
})

// Small helpers so each test stays short
const get = (path) => fetch(`${base}${path}`)
const post = (path, body) =>
  fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

test('the sandbox says it is running', async () => {
  const response = await get('/health')
  assert.equal(response.status, 200)
  const body = await response.json()
  assert.equal(body.status, 'ok')
})

test('balance: a known account shows its name and balance', async () => {
  const response = await get('/accounts/0700000001/balance')
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { phone: '0700000001', name: 'Asha', balanceKsh: 2500 })
})

test('balance: an unknown account gives a structured 404 error', async () => {
  const response = await get('/accounts/0799999999/balance')
  assert.equal(response.status, 404)
  const body = await response.json()
  assert.equal(body.error.code, 'ACCOUNT_NOT_FOUND')
  assert.equal(typeof body.error.message, 'string')
})

test('statement: shows at most five transactions, newest first', async () => {
  const body = await (await get('/accounts/0700000001/statement')).json()
  assert.equal(body.transactions.length, 5)
  assert.equal(body.transactions[0].id, 'T0006')
})

test('statement: a new account has no transactions', async () => {
  const body = await (await get('/accounts/0700000006/statement')).json()
  assert.deepEqual(body.transactions, [])
})

test('send: moves money between two accounts and records it', async () => {
  const response = await post('/send', { from: '0700000001', to: '0700000002', amountKsh: 300 })
  assert.equal(response.status, 200)
  assert.equal((await response.json()).newBalanceKsh, 2200)

  const receiver = await (await get('/accounts/0700000002/balance')).json()
  assert.equal(receiver.balanceKsh, 1500)

  const statement = await (await get('/accounts/0700000001/statement')).json()
  assert.equal(statement.transactions[0].type, 'sent')
  assert.equal(statement.transactions[0].amountKsh, 300)
})

test('send: refuses when there is not enough money, and nothing changes', async () => {
  const response = await post('/send', { from: '0700000004', to: '0700000001', amountKsh: 500 })
  assert.equal(response.status, 422)
  assert.equal((await response.json()).error.code, 'INSUFFICIENT_FUNDS')

  const sender = await (await get('/accounts/0700000004/balance')).json()
  assert.equal(sender.balanceKsh, 300)
})

test('send: refuses when a field is missing', async () => {
  const response = await post('/send', { from: '0700000001', amountKsh: 100 })
  assert.equal(response.status, 400)
  assert.equal((await response.json()).error.code, 'MISSING_FIELD')
})

test('send: refuses an amount that is not a number', async () => {
  const response = await post('/send', { from: '0700000001', to: '0700000002', amountKsh: 'lots' })
  assert.equal(response.status, 400)
  assert.equal((await response.json()).error.code, 'INVALID_AMOUNT')
})

test('send: refuses sending to the same account', async () => {
  const response = await post('/send', { from: '0700000001', to: '0700000001', amountKsh: 100 })
  assert.equal(response.status, 400)
  assert.equal((await response.json()).error.code, 'SAME_ACCOUNT')
})

// DAY 4: write this test after you add Rule 3 in sandbox/app.js.
// Copy the pattern of the "not a number" test above, change the amount to 0 or -500,
// and change test.todo to test.
test.todo('send: refuses an amount of 0 or less')

test('assist: answers with a label that says it is a simulation', async () => {
  const response = await post('/assist', { question: 'How do I check my balance?' })
  assert.equal(response.status, 200)
  const body = await response.json()
  assert.equal(body.source, 'simulation')
  assert.equal(body.fallback, false)
  assert.ok(body.disclosure.length > 0)
})

test('assist: gives a fallback answer when it cannot help', async () => {
  const body = await (await post('/assist', { question: 'What is the weather like?' })).json()
  assert.equal(body.fallback, true)
})

test('assist: refuses a question with a phone number in it', async () => {
  const response = await post('/assist', { question: 'What is the balance of 0700 000 001?' })
  assert.equal(response.status, 400)
  assert.equal((await response.json()).error.code, 'PERSONAL_DATA')
})

test('assist: can pretend the model is down', async () => {
  const response = await post('/assist?fail=true', { question: 'How do I send money?' })
  assert.equal(response.status, 503)
  assert.equal((await response.json()).error.code, 'MODEL_UNAVAILABLE')
})

test('an unknown address gives a structured 404 error', async () => {
  const response = await get('/no-such-place')
  assert.equal(response.status, 404)
  assert.equal((await response.json()).error.code, 'NOT_FOUND')
})
