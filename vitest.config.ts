import { defineConfig } from 'vitest/config'

/**
 * Vitest config aparte de vite.config.ts (que es para el dev server / build).
 * jsdom como entorno por defecto: necesario para los tests que tocan
 * localStorage (totp, bannedWords).
 */
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: false,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    clearMocks: true,
  },
})
