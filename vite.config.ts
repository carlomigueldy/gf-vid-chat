import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id: string) => {
          // React core — loaded first, always needed
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react'
          }
          // Router
          if (id.includes('node_modules/react-router')) {
            return 'router'
          }
          // Animation — heavy, lazy-load friendly
          if (id.includes('node_modules/framer-motion')) {
            return 'framer-motion'
          }
          // PeerJS + WebRTC deps — by far the biggest chunk
          if (id.includes('node_modules/peerjs') || id.includes('node_modules/webrtc-adapter')) {
            return 'peerjs'
          }
          // html5-qrcode is only used inside the camera scanner (dynamically imported)
          if (id.includes('node_modules/html5-qrcode')) {
            return 'html5-qrcode'
          }
          // Static QR libs used for display + file-decode
          if (id.includes('node_modules/qrcode') || id.includes('node_modules/jsqr')) {
            return 'qr'
          }
          // Everything else in node_modules goes to vendor
          if (id.includes('node_modules/')) {
            return 'vendor'
          }
        },
      },
    },
  },
})
