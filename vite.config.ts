import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: process.env.PORT ? parseInt(process.env.PORT) : 5173,
    // En el devcontainer (bind mount Windows -> Linux) inotify no propaga eventos
    // del host al contenedor, asi que el HMR no detecta cambios. Polling lo arregla.
    watch: {
      usePolling: true,
      interval: 300,
    },
    proxy: {
      // Redirige llamadas /api/* al backend Spring Boot
      // Dentro del devcontainer usa el nombre del servicio Docker; fuera, localhost
      '/api': {
        target: process.env.VITE_BACKEND_URL ?? 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  define: {
    global: 'globalThis',
  },
  // `npm run preview` sirve el build de produccion (dist/) en el puerto 4173.
  // host: true => escucha en 0.0.0.0 para que el devcontainer lo exponga al host Windows.
  preview: {
    host: true,
    port: 4173,
  },
})
