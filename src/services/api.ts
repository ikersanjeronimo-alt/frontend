const BASE = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:8080'
const TOKEN_KEY = 'sys_token'

export interface ApiError extends Error {
  /** Código HTTP, o 0 si fue error de red (back caído, CORS, timeout). */
  status: number
}

export function makeApiError(status: number, message: string): ApiError {
  const err = new Error(message) as ApiError
  err.name = 'ApiError'
  err.status = status
  return err
}

/** True si el error indica "backend inalcanzable" (red caída, CORS, DNS). */
export function isNetworkError(e: unknown): e is ApiError {
  return e instanceof Error && (e as ApiError).status === 0
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY)

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  let res: Response
  try {
    res = await fetch(`${BASE}${path}`, { ...options, headers })
  } catch {
    // fetch() rechaza con TypeError cuando hay error de red, CORS o DNS.
    throw makeApiError(0, 'No se pudo conectar con el servidor.')
  }

  if (res.status === 401) {
    // Excluir el propio flujo de auth: un 401 en /api/auth/login es credencial mala,
    // no sesión expirada. El componente que llamó debe mostrar el mensaje.
    const isAuthFlow = path.startsWith('/api/auth/')
    if (!isAuthFlow) {
      localStorage.removeItem(TOKEN_KEY)
      // Notificar al AuthProvider via custom event en vez de window.location
      // para no perder el estado de la SPA.
      window.dispatchEvent(new CustomEvent('auth:expired'))
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
