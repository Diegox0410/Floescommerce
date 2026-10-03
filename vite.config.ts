import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/catalog': { target: 'https://chopify-ten.vercel.app', changeOrigin: true },
      '/images/products/floes': { target: 'https://chopify-ten.vercel.app', changeOrigin: true },
    },
  },
})
