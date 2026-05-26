import { isNetworkError } from '../services/api'
import { ALLOW_MOCK_FALLBACK } from './env'
import { markDemoMode } from './demoMode'

/**
 * Patrón de mutación con optimistic update + rollback.
 *
 * Fases:
 *   1. Se aplica el cambio optimista al estado.
 *   2. Se llama al backend.
 *   3a. Si responde, `onSuccess` reemplaza la versión optimista por la real
 *       (típicamente con el ID del server).
 *   3b. Si falla por red Y estamos en modo demo: mantenemos el cambio
 *       optimista (no rollback) y marcamos demo mode para que el banner
 *       aparezca.
 *   3c. En cualquier otro error: rollback + re-lanzar para que la UI lo vea.
 */
export interface OptimisticMutationOps<T, R> {
  setData:    (next: T | ((prev: T) => T)) => void
  optimistic: (prev: T) => T
  call:       () => Promise<R>
  onSuccess:  (prev: T, result: R) => T
  rollback:   (prev: T) => T
}

export async function optimisticMutation<T, R>(ops: OptimisticMutationOps<T, R>): Promise<void> {
  ops.setData(ops.optimistic)
  try {
    const result = await ops.call()
    ops.setData(prev => ops.onSuccess(prev, result))
  } catch (e) {
    if (isNetworkError(e) && ALLOW_MOCK_FALLBACK) {
      markDemoMode()
      return
    }
    ops.setData(ops.rollback)
    throw e
  }
}
