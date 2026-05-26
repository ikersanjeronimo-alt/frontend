import { useState, useCallback, useEffect, useRef } from 'react'

/**
 * Patrón "Guardado" temporal. Llama a `flash()` tras una operación con éxito y
 * el flag `shown` queda true durante `ms` (1500 por defecto), luego vuelve a
 * false automáticamente. Cancela el timer al desmontar.
 */
export function useSavedFlash(ms = 2000) {
  const [shown, setShown] = useState(false)
  const timerRef = useRef<number | null>(null)

  const flash = useCallback(() => {
    setShown(true)
    if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => {
      setShown(false)
      timerRef.current = null
    }, ms)
  }, [ms])

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    }
  }, [])

  return [shown, flash] as const
}
