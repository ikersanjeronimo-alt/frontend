/**
 * Bus singleton para señalar "el token expiró" desde el módulo de fetch
 * (servicios) al árbol React (AuthProvider).
 *
 * Diseño:
 *  - `fireExpired()` notifica a todos los listeners actuales.
 *  - Si no hay listeners aún (race condition: la primera respuesta llega antes
 *    de que el AuthProvider haya montado), guardamos `pending = true` y se
 *    entrega al primer suscriptor.
 *
 * Sustituye al `window.dispatchEvent(new CustomEvent('auth:expired'))` que
 * tenía dos problemas: (1) acoplado al DOM global, (2) se perdía si el listener
 * no estaba montado en el momento exacto del fire.
 */
type Listener = () => void

const listeners = new Set<Listener>()
let pending = false

export const authBus = {
  fireExpired(): void {
    if (listeners.size === 0) {
      pending = true
      return
    }
    listeners.forEach(l => l())
  },

  onExpired(fn: Listener): () => void {
    listeners.add(fn)
    if (pending) {
      pending = false
      // Microtask: dejar que el provider termine su mount antes de re-disparar.
      queueMicrotask(fn)
    }
    return () => { listeners.delete(fn) }
  },
}
