// Shows your repository in the codespace preview on port 3000, the same files GitHub Pages shows on Day 8.
// It never shows hidden files or folders (such as .git) or node_modules. `npm start` runs it.
import { fileURLToPath } from 'node:url'
import httpServer from 'http-server'

const PORT = 3000
const ROOT = fileURLToPath(new URL('..', import.meta.url))

// True for any address with a part that starts with "." or is node_modules
function isHidden(url) {
  try {
    const path = decodeURIComponent(new URL(url, 'http://localhost').pathname)
    return path.split('/').some((part) => part.startsWith('.') || part === 'node_modules')
  } catch {
    return true
  }
}

const server = httpServer.createServer({
  root: ROOT,
  cache: -1,
  showDir: 'false',
  showDotfiles: false,
  before: [
    (req, res) => {
      if (isHidden(req.url)) {
        res.statusCode = 404
        res.end('Not found')
        return
      }
      res.emit('next')
    },
  ],
})

server.listen(PORT, () => {
  console.log(`Preview running on port ${PORT}. Press Ctrl+C to stop it.`)
})
