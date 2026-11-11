// Tests for findAnswer. They use the two sample answers in data/prepared-answers.json.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { findAnswer } from '../src/prepared-answers.js'

const { answers } = JSON.parse(await readFile(new URL('../data/prepared-answers.json', import.meta.url), 'utf8'))

test('a question with matching keywords gets the checked answer', () => {
  const result = findAnswer('What does 10 mm of rain mean?', answers)

  assert.equal(result.ok, true)
  assert.match(result.data.answer, /millimetres deep/)
  assert.equal(result.data.checkedOn, '2026-11-11')
})

test('a question with no matching keywords gives NO_MATCH', () => {
  const result = findAnswer('Which football team will win?', answers)

  assert.equal(result.ok, false)
  assert.equal(result.error.code, 'NO_MATCH')
})

test('an empty question gives EMPTY_QUESTION', () => {
  const result = findAnswer('   ', answers)

  assert.equal(result.ok, false)
  assert.equal(result.error.code, 'EMPTY_QUESTION')
})

test('a question with a phone number gives BLOCKED_TOPIC', () => {
  const result = findAnswer('Can you text revision tips to 0712 345 678?', answers)

  assert.equal(result.ok, false)
  assert.equal(result.error.code, 'BLOCKED_TOPIC')
})

test('a question with an email address gives BLOCKED_TOPIC', () => {
  const result = findAnswer('Send exam tips to someone@example.com', answers)

  assert.equal(result.ok, false)
  assert.equal(result.error.code, 'BLOCKED_TOPIC')
})

test('a question with a blocked word gives BLOCKED_TOPIC', () => {
  const result = findAnswer('My password is mango, will it rain?', answers)

  assert.equal(result.ok, false)
  assert.equal(result.error.code, 'BLOCKED_TOPIC')
})
