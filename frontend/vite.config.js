import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// During dev, proxy backend endpoints to the FastAPI server on :8000
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/run': 'http://localhost:8000',
      '/health': 'http://localhost:8000',
      '/profile': 'http://localhost:8000',
    },
  },
})
