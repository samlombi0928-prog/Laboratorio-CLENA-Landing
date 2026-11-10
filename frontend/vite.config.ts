import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // En desarrollo, la API se sirve desde el mismo origen que la página, igual
    // que en el despliegue: la cookie de sesión es SameSite=strict.
    proxy: {
      '/api': 'http://localhost:3000',
      '/archivos': 'http://localhost:3000',
    },
  },
})
