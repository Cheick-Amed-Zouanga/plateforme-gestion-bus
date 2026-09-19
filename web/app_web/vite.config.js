import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'kill-stale-pwa',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = req.url || ''
          // Ancien vite-plugin-pwa en mode dev
          if (url.includes('@vite-plugin-pwa/pwa-entry-point-loaded')) {
            res.statusCode = 204
            res.end()
            return
          }
          if (url.startsWith('/dev-sw.js') || url.includes('workbox-')) {
            res.setHeader('Content-Type', 'application/javascript')
            res.end(`
              self.addEventListener('install', e => self.skipWaiting());
              self.addEventListener('activate', e => e.waitUntil((async () => {
                const keys = await caches.keys();
                await Promise.all(keys.map(k => caches.delete(k)));
                await self.registration.unregister();
              })()));
            `)
            return
          }
          next()
        })
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
