import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const isGitHubPages = process.env.GITHUB_ACTIONS === 'true'
const base = isGitHubPages ? '/talking-cat-pwa/' : '/'

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['mochi-icon.svg', 'apple-touch-icon.png'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        navigateFallbackDenylist: [/^\/api\//],
      },
      manifest: {
        name: 'Mochi — Talking Cat',
        short_name: 'Mochi Cat',
        description: 'A playful talking cat that copies you and chats safely with young children.',
        theme_color: '#7c3aed',
        background_color: '#fff7ed',
        display: 'standalone',
        orientation: 'portrait',
        start_url: base,
        scope: base,
        icons: [
          { src: 'apple-touch-icon.png', sizes: '180x180', type: 'image/png', purpose: 'any' },
          { src: 'mochi-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'mochi-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' }
        ]
      }
    })
  ]
})
