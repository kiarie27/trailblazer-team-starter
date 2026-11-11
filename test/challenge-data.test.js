// Checks every challenge data file in data/challenges/ works with getItems.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import { getItems } from '../src/service.js'

const folder = new URL('../data/challenges/', import.meta.url)
const files = (await readdir(folder)).filter((name) => name.endsWith('.json'))

test('there are eight challenge data files', () => {
  assert.equal(files.length, 8)
})

for (const name of files) {
  test(`getItems can read data/challenges/${name}`, async () => {
    const text = await readFile(new URL(name, folder), 'utf8')
    const fetchFn = () => Promise.resolve(new Response(text, { status: 200 }))

    const result = await getItems(fetchFn)

    assert.equal(result.ok, true)
    assert.ok(result.data.length > 0)
    for (const item of result.data) {
      assert.ok('id' in item && 'title' in item && 'detail' in item)
    }
  })
}
