import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/bcv-scraping': {
        target: 'https://www.bcv.org.ve',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/bcv-scraping/, ''),
        secure: false, // El BCV a veces tiene problemas de certificados
      }
    }
  }
})
