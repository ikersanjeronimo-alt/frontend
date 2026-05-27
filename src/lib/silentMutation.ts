/**
 * Patrón best-effort para mutaciones "fire-and-forget" (toggles de Settings,
 * mood, like de evento...): no bloquean al usuario con loading state, pero
 * tampoco silencian errores reales del servidor.
 *
 * Devuelve null si OK, o el mensaje de error si algo falla.
 * El consumidor decide cómo mostrar el error (toast, feedback inline, etc.).
 */
export async function silentMutation(promise: Promise<unknown>): Promise<string | null> {
  try {
    await promise
    return null
  } catch (e) {
    return e instanceof Error ? e.message : 'Error.'
  }
}
