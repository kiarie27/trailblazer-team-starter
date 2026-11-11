// Shows your repository in the codespace preview on port 3000, the same files GitHub Pages shows on Day 8.
// It never shows hidden files or folders (such as .git) or node_modules. `npm start` runs it.
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import httpServer from 'http-server'

const PORT = 3000
const ROOT = path.resolve(fileURLToPath(new URL('..', import.meta.url)))

// True only for addresses inside the repository that are not hidden
export function isAllowed(requestTarget) {
  // Exactly one slash at the start, and no backslashes anywhere
  if (!/^\/(?!\/)/.test(requestTarget) || requestTarget.includes('\\')) {
    return false
  }

  // Drop anything after ? or #, then decode each part of the path
  const rawPath = requestTarget.split(/[?#]/)[0]
  let decoded
  try {
    decoded = rawPath
      .split('/')
      .map((part) => decodeURIComponent(part))
      .join('/')
  } catch {
    return false
  }
  if (decoded.includes('\\') || decoded.includes('\0')) {
    return false
  }

  // Work out the real file path and check it stays inside the repository
  const resolved = path.resolve(ROOT, '.' + path.normalize(decoded))
  const relative = path.relative(ROOT, resolved)
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    return false
  }

  // No hidden parts (starting with ".") and no node_modules
  return relative
    .split(path.sep)
    .every((part) => !part.startsWith('.') && part !== 'node_modules')
}

export function createPreviewServer() {
  return httpServer.createServer({
    root: ROOT,
    cache: -1,
    showDir: 'false',
    showDotfiles: false,
    before: [
      (req, res) => {
        if (!isAllowed(req.url)) {
          res.statusCode = 404
          res.end('Not found')
          return
        }
        res.emit('next')
      },
    ],
  })
}

// Start the server only when this file is run with node (not when a test imports it)
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  createPreviewServer().listen(PORT, () => {
    console.log(`Preview running on port ${PORT}. Press Ctrl+C to stop it.`)
  })
}
