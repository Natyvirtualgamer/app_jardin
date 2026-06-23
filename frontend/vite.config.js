import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const apiTarget = process.env.VITE_API_PROXY_TARGET || 'http://jardin-alb-dev-1906176875.us-east-1.elb.amazonaws.com'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
      }
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.js',
  }
})
