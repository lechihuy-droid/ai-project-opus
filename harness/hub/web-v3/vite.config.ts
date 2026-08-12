import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss()],
  // Vite defaults to 5173 and ignores PORT, so two dev servers collide. Honour the
  // port the launcher assigns; fall back to Vite's own default when nothing is set.
  server: { port: Number(process.env.PORT) || undefined, proxy: { '/api': 'http://127.0.0.1:8799' } },
  test: { environment: 'jsdom' },
})
