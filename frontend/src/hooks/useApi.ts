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
 *  - Si hay error de red (back caído) Y estamos en modo demo: cae a `fallback`
 *    y marca demo mode (banner global).
 *  - En cualquier otro error (servidor o red sin demo): expone el mensaje
 *    en `error` para que la UI lo muestre.
 *
 * Estado en un único objeto para evitar setStates síncronos dentro del
 * effect (regla react-hooks/set-state-in-effect de eslint v10).
 */
export function useApi<T>(fetcher: () => Promise<T>, fallback: T, deps: unknown[] = []) {
  const [state, setState] = useState<ApiState<T>>({
    data: fallback,
    loading: true,
    error: null,
  })

  useEffect(() => {
    let cancelled = false
    fetcher()
      .then(res => {
        if (!cancelled) setState({ data: res, loading: false, error: null })
      })
      .catch(e => {
        if (cancelled) return
        if (isNetworkError(e) && ALLOW_MOCK_FALLBACK) {
          markDemoMode()
          setState({ data: fallback, loading: false, error: null })
        } else {
          setState(s => ({ ...s, loading: false, error: e?.message ?? 'Error al cargar.' }))
        }
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
