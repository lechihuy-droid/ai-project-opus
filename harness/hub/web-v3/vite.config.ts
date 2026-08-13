import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// The hub gates /api on a token. In production the server serves index.html and
// sets that token as a cookie, so the page is authenticated by loading. Here Vite
// serves the page instead, so nothing sets the cookie and every call came back 403
// with "No valid workflows." on screen. The token lives in a file next to the
// server, and this proxy runs on the same machine, so it can just read it and
// attach the header the browser cannot.
const tokenPath = fileURLToPath(new URL('../runtime/store/hub-token', import.meta.url))
const hubToken = () => {
  try {
    return readFileSync(tokenPath, 'utf8').trim()
  } catch {
    return ''  // hub not started yet; the request 403s and says so, same as before
  }
}

export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss()],
  // Vite defaults to 5173 and ignores PORT, so two dev servers collide. Honour the
  // port the launcher assigns; fall back to Vite's own default when nothing is set.
  server: {
    port: Number(process.env.PORT) || undefined,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8799',
        // Read per request, not once at startup: the hub writes a new token
        // whenever its store is cleared, and a stale one here would 403 with no
        // hint that restarting Vite is what fixes it.
        configure: proxy => proxy.on('proxyReq', request => {
          const token = hubToken()
          if (token) request.setHeader('X-Hub-Token', token)
        }),
      },
    },
  },
  test: { environment: 'jsdom' },
})
