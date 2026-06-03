import { authBus } from '../lib/authBus'
import { tokenStorage } from './storage'

const BASE = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:8080'

/** Timeout por defecto para evitar requests colgadas indefinidamente.
 *  El caller puede sobrescribirlo o pasar su propio AbortSignal. */
const DEFAULT_TIMEOUT_MS = 15000

export interface ApiError extends Error {
  /** Código HTTP, o 0 si fue error de red (back caído, CORS, timeout, abort). */
  status: number
}

export function makeApiError(status: number, message: string): ApiError {
  const err = new Error(message) as ApiError
  err.name = 'ApiError'
  err.status = status
  return err
}

/** True si el error indica "backend inalcanzable" (red caída, CORS, DNS, timeout). */
export function isNetworkError(e: unknown): e is ApiError {
  return e instanceof Error && (e as ApiError).status === 0
}

export interface ApiFetchOptions extends RequestInit {
  /** Timeout en ms; por defecto 15s. Pasa 0 (o un signal externo) para desactivarlo. */
  timeoutMs?: number
  /** Si true, un 401 no dispara `authBus.fireExpired()` (útil para la sonda de
   *  restauración de sesión al arrancar, donde un 401 es esperado). */
  suppressAuthExpired?: boolean
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, signal: callerSignal, suppressAuthExpired = false, ...rest } = options
  const token = tokenStorage.get()

  // Solo añadimos Content-Type si hay body — evita preflights CORS innecesarios
  // en GETs y peticiones sin payload.
  const headers: Record<string, string> = { ...(rest.headers as Record<string, string>) }
  if (rest.body) headers['Content-Type'] = 'application/json'
  if (token)     headers['Authorization'] = `Bearer ${token}`

  // AbortController interno para implementar el timeout. Si el caller también
  // pasa signal, "encadenamos" ambos: cuando cualquiera aborta, el interno lo
  // hace también. AbortSignal.any() es lo cleanest, pero solo Chrome 116+/FF
  // 124+ — fallback con addEventListener.
  const internal = new AbortController()
  const timer = timeoutMs > 0
    ? window.setTimeout(() => internal.abort(makeApiError(0, 'La petición ha tardado demasiado.')), timeoutMs)
    : null

  if (callerSignal) {
    if (callerSignal.aborted) internal.abort(callerSignal.reason)
    else callerSignal.addEventListener('abort', () => internal.abort(callerSignal.reason), { once: true })
  }

  let res: Response
  try {
    res = await fetch(`${BASE}${path}`, { ...rest, headers, signal: internal.signal })
  } catch (cause) {
    // El caller canceló explícitamente: re-lanzar el AbortError tal cual para
    // que el consumidor pueda distinguirlo (ej. el `cancelled` de useApi).
    if (callerSignal?.aborted) throw cause
    // Timeout interno (abort por nuestro setTimeout): el reason ya es un ApiError.
    if (internal.signal.aborted && internal.signal.reason instanceof Error
        && (internal.signal.reason as ApiError).status === 0) {
      throw internal.signal.reason
    }
    // Resto: TypeError de fetch (red caída, CORS, DNS).
    throw makeApiError(0, 'No se pudo conectar con el servidor.')
  } finally {
    if (timer !== null) window.clearTimeout(timer)
  }

  if (res.status === 401) {
    // Excluir el propio flujo de auth: un 401 en /api/auth/login es credencial mala,
    // no sesión expirada. El componente que llamó debe mostrar el mensaje.
    const isAuthFlow = path.startsWith('/api/auth/')
    if (!isAuthFlow) {
      tokenStorage.clear()
      // Notificar al AuthProvider via bus singleton — resistente a race
      // conditions del orden de mount (ver lib/authBus.ts). Se omite en la sonda
      // de restauración de sesión, donde un 401 es esperado y no una expiración.
      if (!suppressAuthExpired) authBus.fireExpired()
    }
    throw makeApiError(401, isAuthFlow ? 'Credenciales incorrectas.' : 'Sesión expirada.')
  }

  if (!res.ok) {
    let msg = `Error ${res.status}`
    try {
      const body = await res.json()
      msg = body?.message ?? body?.error ?? msg
    } catch { /* sin body JSON */ }
    throw makeApiError(res.status, msg)
  }

  if (res.status === 204) return undefined as T

  return res.json() as Promise<T>
}
