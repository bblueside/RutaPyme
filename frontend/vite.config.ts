import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // La API real (python main.py) no tiene CORS: el panel la consume a través de este proxy.
    proxy: { '/api': 'http://127.0.0.1:8000' },
  },
})
