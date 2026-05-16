import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// During dev, proxy backend endpoints to the FastAPI server on :8000
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/run':       process.env.BACKEND_URL || 'http://127.0.0.1:8000',
      '/health':    process.env.BACKEND_URL || 'http://127.0.0.1:8000',
      '/profile':   process.env.BACKEND_URL || 'http://127.0.0.1:8000',
      '/find-jobs': process.env.BACKEND_URL || 'http://127.0.0.1:8000',
    },
  },
})
