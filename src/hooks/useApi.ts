import { useState, useEffect } from 'react'
import { isNetworkError } from '../services/api'
import { ALLOW_MOCK_FALLBACK } from '../lib/env'
import { markDemoMode } from '../lib/demoMode'

interface ApiState<T> {
  data: T
  loading: boolean
  error: string | null
}

/**
 * Helper genérico para hooks de datos.
 *
 * Llama al `fetcher` al montar:
 *  - Si responde, devuelve esos datos.
 *  - Si hay error de red (back caído) Y estamos en modo demo Y se pasó un
 *    `mockFallback`: lo importa dinámicamente, devuelve esos datos y marca
 *    demo mode (banner global). Esto saca los `MOCK_*` del bundle de prod.
 *  - En cualquier otro error (servidor, o red sin demo): expone el mensaje
 *    en `error` para que la UI lo muestre.
 *
 * `initialData` debe ser un valor vacío sincrónico (ej. `[]`) que se muestra
 * durante `loading: true`. Es el único `T` que viaja al bundle siempre.
 *
 * Estado en un único objeto para evitar setStates síncronos dentro del
 * effect (regla react-hooks/set-state-in-effect de eslint v10).
 */
export function useApi<T>(
  fetcher: () => Promise<T>,
  initialData: T,
  mockFallback?: () => Promise<T>,
  deps: unknown[] = [],
) {
  const [state, setState] = useState<ApiState<T>>({
    data: initialData,
    loading: true,
    error: null,
  })

  useEffect(() => {
    let cancelled = false
    fetcher()
      .then(res => {
        if (!cancelled) setState({ data: res, loading: false, error: null })
      })
      .catch(async e => {
        if (cancelled) return
        if (isNetworkError(e) && ALLOW_MOCK_FALLBACK && mockFallback) {
          try {
            const fallbackData = await mockFallback()
            if (cancelled) return
            markDemoMode()
            setState({ data: fallbackData, loading: false, error: null })
            return
          } catch {
            // Si el dynamic import falla (red, parsing), caemos al error normal.
          }
        }
        setState(s => ({ ...s, loading: false, error: e?.message ?? 'Error al cargar.' }))
      })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  const setData = (next: T | ((prev: T) => T)) => {
    setState(s => ({
      ...s,
      data: typeof next === 'function' ? (next as (p: T) => T)(s.data) : next,
    }))
  }

  return { data: state.data, setData, loading: state.loading, error: state.error }
}
