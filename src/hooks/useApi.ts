import { useState, useEffect } from 'react'

interface ApiState<T> {
  data: T
  loading: boolean
  error: string | null
}

export function useApi<T>(
  fetcher: () => Promise<T>,
  initialData: T,
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
      .catch(e => {
        if (!cancelled)
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
