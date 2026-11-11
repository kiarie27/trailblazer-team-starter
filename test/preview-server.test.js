// Checks the codespace preview server never shows hidden files or node_modules.
// It starts the server on a free port and sends each address exactly as written.
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import { createPreviewServer } from '../.devcontainer/preview-server.js'

let server
let port

before(async () => {
  server = createPreviewServer()
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  port = server.server.address().port
})

after(() => server.close())

// Sends a GET with the path exactly as written (no clean-up by a URL parser)
function statusFor(rawPath) {
  return new Promise((resolve, reject) => {
    const request = http.request({ host: '127.0.0.1', port, path: rawPath, method: 'GET' }, (response) => {
      response.resume()
      resolve(response.statusCode)
    })
    request.on('error', reject)
    request.end()
  })
}

const hidden = [
  '/.git/config',
  '//.git/config',
  '/%2Egit/config',
  '/practice/../.git/config',
  '/%2e%2e/%2egit/config',
  '/node_modules/x',
  '/.github/workflows/checks.yml',
  '//.github/workflows/checks.yml',
  '/practice/..%2f.github/workflows/checks.yml',
  '/%5c.github/workflows/checks.yml',
]

for (const rawPath of hidden) {
  test(`the preview hides ${rawPath}`, async () => {
    assert.equal(await statusFor(rawPath), 404)
  })
}

for (const rawPath of ['/', '/practice/']) {
  test(`the preview shows ${rawPath}`, async () => {
    assert.equal(await statusFor(rawPath), 200)
  })
}
