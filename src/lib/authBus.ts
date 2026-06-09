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
// El listener recibe el token recien caducado (o null), para poder intentar
// renovarlo via /api/auth/refresh. El token ya se ha borrado de localStorage
// cuando esto se dispara, asi que viaja por aqui en memoria.
type Listener = (expiredToken: string | null) => void

const listeners = new Set<Listener>()
let pending = false
let pendingToken: string | null = null

export const authBus = {
  fireExpired(expiredToken: string | null = null): void {
    if (listeners.size === 0) {
      pending = true
      pendingToken = expiredToken
      return
    }
    listeners.forEach(l => l(expiredToken))
  },

  onExpired(fn: Listener): () => void {
    listeners.add(fn)
    if (pending) {
      pending = false
      const tk = pendingToken
      pendingToken = null
      // Microtask: dejar que el provider termine su mount antes de re-disparar.
      queueMicrotask(() => fn(tk))
    }
    return () => { listeners.delete(fn) }
  },
}
