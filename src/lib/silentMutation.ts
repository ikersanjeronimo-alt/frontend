import { isNetworkError } from '../services/api'
import { ALLOW_MOCK_FALLBACK } from './env'
import { markDemoMode } from './demoMode'

/**
 * Patrón best-effort para mutaciones "fire-and-forget" (toggles de Settings,
 * mood, like de evento...): no bloquean al usuario con loading state, pero
 * tampoco silencian errores reales del servidor.
 *
 * Devuelve:
 *  - `null` si OK
 *  - `null` si fue error de red Y la flag de demo está activa (asumimos que
 *    el back no existe todavía y marcamos demo mode para que aparezca el
 *    banner global). El cambio "optimista" del consumidor se mantiene.
 *  - El mensaje del error si el servidor respondió mal (4xx/5xx) o si fue
 *    error de red SIN flag de demo. El consumidor decide cómo enseñarlo
 *    (toast, feedback bajo el control, etc.).
 *
 * Sustituye al patrón copy-pasted `.catch(() => {})` que silenciaba ciegamente
 * cualquier error en N call sites — incluidos errores reales del servidor.
 */
export async function silentMutation(promise: Promise<unknown>): Promise<string | null> {
  try {
    await promise
    return null
  } catch (e) {
    if (isNetworkError(e) && ALLOW_MOCK_FALLBACK) {
      markDemoMode()
      return null
    }
    return e instanceof Error ? e.message : 'Error.'
  }
}
