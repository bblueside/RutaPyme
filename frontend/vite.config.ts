import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // La API real (python main.py) no tiene CORS: el panel la consume a través de este proxy.
    // API_TARGET permite apuntar a otra API (p. ej. otro puerto) sin tocar el código; por defecto, el puerto 8000.
    proxy: { '/api': process.env.API_TARGET ?? 'http://127.0.0.1:8000' },
  },
})
