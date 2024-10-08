import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const backendPort = process.env.REACT_APP_BACKEND_PORT || 5000;

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/api': {
        target: `http://localhost:${backendPort}`,
        changeOrigin: true,
      },
      '/auth': {
        target: `http://localhost:${backendPort}`,
        changeOrigin: true,
      },
    },
  },
})