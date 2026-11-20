// Production static server for the built Vite app.
// Local dev uses `npm run dev`; on Render this is launched via `npm start`.
// Binds 0.0.0.0:$PORT so Render's port scan can reach it (Vite's dev server only binds localhost).
import { createServer } from 'node:http'
import { createReadStream } from 'node:fs'
import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'dist')
const port = Number.parseInt(process.env.PORT ?? '10000', 10)
const host = process.env.HOST ?? '0.0.0.0'

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
}

const BASE_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'SAMEORIGIN',
}

function send(res, status, body) {
  res.writeHead(status, {
    ...BASE_HEADERS,
    'Content-Type': 'text/plain; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  })
  res.end(body)
}

function cacheControl(pathname) {
  // Vite fingerprints assets in /assets/, so they can be cached forever.
  if (pathname.startsWith('/assets/')) return 'public, max-age=31536000, immutable'
  if (pathname === '/index.html') return 'no-cache, no-store, must-revalidate'
  return 'public, max-age=3600'
}

const server = createServer(async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { ...BASE_HEADERS, Allow: 'GET, HEAD' })
    res.end()
    return
  }

  let pathname
  try {
    pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname)
  } catch {
    send(res, 400, 'Bad Request')
    return
  }

  // Resolve inside dist/ only — never serve files outside the build output.
  const filePath = path.resolve(root, `.${pathname}`)
  if (filePath !== root && !filePath.startsWith(root + path.sep)) {
    send(res, 403, 'Forbidden')
    return
  }

  try {
    const info = await stat(filePath)
    if (info.isFile()) {
      res.writeHead(200, {
        ...BASE_HEADERS,
        'Content-Type': CONTENT_TYPES[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream',
        'Content-Length': info.size,
        'Cache-Control': cacheControl(pathname),
      })
      if (req.method === 'HEAD') {
        res.end()
      } else {
        createReadStream(filePath).pipe(res)
      }
      return
    }
  } catch (err) {
    if (err?.code !== 'ENOENT' && err?.code !== 'ENOTDIR') {
      send(res, 500, 'Internal Server Error')
      return
    }
  }

  // Unknown path: react-router handles it client-side, so return the app shell.
  try {
    const index = path.join(root, 'index.html')
    const info = await stat(index)
    const body = await readFile(index)
    res.writeHead(200, {
      ...BASE_HEADERS,
      'Content-Type': CONTENT_TYPES['.html'],
      'Content-Length': info.size,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    })
    res.end(req.method === 'HEAD' ? undefined : body)
  } catch {
    send(res, 503, 'Build missing — run `npm run build` first.')
  }
})

server.listen(port, host, () => {
  console.log(`Serving dist/ on http://${host}:${port}`)
})
