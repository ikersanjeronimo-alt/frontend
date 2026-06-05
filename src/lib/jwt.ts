// Helper para decodificar JWT sin validar firma (ya validado por el servidor)
export interface JWTPayload {
  id?: string
  sub?: string
  username?: string
  email?: string
  role?: string
  iat?: number
  exp?: number
  [key: string]: unknown
}

export function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    
    // Decodificar el payload (parte 2)
    const payload = parts[1]
    if (!payload) return null
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(decoded)
  } catch {
    return null
  }
}
