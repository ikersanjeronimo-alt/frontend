/**
 * Estado global "modo demostración" — se activa cuando alguna llamada al back
 * cae al fallback al mock (back caído / endpoint no implementado) Y el flag
 * VITE_USE_MOCK_FALLBACK está activo. Un banner global lo refleja.
 *
 * Vive fuera de React (módulo singleton) para que `apiFetch`, `useApi` y los
 * handlers de escritura puedan marcarlo sin acoplarse al árbol de componentes.
 * Los consumidores se suscriben vía useDemoMode().
 */
type Listener = (active: boolean) => void

let active = false
const listeners = new Set<Listener>()

export function markDemoMode(): void {
  if (active) return
  active = true
  listeners.forEach(l => l(true))
}

export function getDemoMode(): boolean {
  return active
}

export function subscribeDemoMode(fn: Listener): () => void {
  listeners.add(fn)
  return () => { listeners.delete(fn) }
}
