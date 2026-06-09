import { apiFetch } from './api'
import { tokenStorage } from './storage'
import { decodeJWT } from '../lib/jwt'
import type {
  AuthResponse,
  ApiUser,
  UserRole,
  RegisterModPayload,
  VerifyTotpPayload,
} from '../types/api'

// ── Mapping de roles backend ↔ frontend ─────────────────────
// El backend conoce PROFESSIONAL/ADMINISTRATOR (moderación). Para usuarios
// finales (registrados y anónimos), asumimos que devolverá USER/ANON. El
// front trabaja siempre con los 4 valores de UserRole — la traducción vive
// solo en esta capa para que el resto de la app no se entere.

type BackendRole = 'PROFESSIONAL' | 'ADMINISTRATOR' | 'USER' | 'ANON'

interface BackendUser {
  id: string
  username: string
  role: BackendRole
}

interface BackendAuthResponse {
  token: string
  user: BackendUser
}

function mapBackendRole(role: BackendRole): UserRole {
  switch (role) {
    case 'PROFESSIONAL':  return 'MODERATOR'
    case 'ADMINISTRATOR': return 'ADMIN'
    case 'USER':          return 'USER'
    case 'ANON':          return 'ANON'
    default:              return 'ANON'
  }
}

function adaptAuthResponse(r: BackendAuthResponse): AuthResponse {
  const user: ApiUser = {
    id:       r.user.id,
    username: r.user.username,
    role:     mapBackendRole(r.user.role),
  }
  return { token: r.token, user }
}

export function restoreAuthFromToken(token: string): AuthResponse | null {
  const payload = decodeJWT(token)
  if (!payload) return null
  if (typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now()) {
    return null
  }

  const role = mapBackendRole((payload.role as BackendRole) ?? 'ANON')
  const user: ApiUser = {
    id: String(payload.id || payload.sub || ''),
    username: String(payload.username || payload.email || ''),
    role,
  }
  if (!user.id || !user.username) return null
  return { token, user }
}

// ── Endpoints ──────────────────────────────────────────────

export async function initAnonymous(): Promise<AuthResponse> {
  const savedToken = tokenStorage.get()
  const r = await apiFetch<BackendAuthResponse>('/api/auth/anonymous', {
    method: 'POST',
    body: JSON.stringify({ anonToken: savedToken ?? null }),
  })
  return adaptAuthResponse(r)
}

/** Restaura la sesión a partir del token guardado (cualquier rol). Un 401 aquí
 *  significa "no hay sesión válida", no "sesión expirada" — por eso suprime el bus. */
export async function getMe(): Promise<ApiUser> {
  const r = await apiFetch<BackendUser>('/api/users/me', { suppressAuthExpired: true })
  return {
    id: r.id,
    username: r.username,
    role: mapBackendRole(r.role),
  }
}

export async function login(username: string, password: string): Promise<AuthResponse> {
  const r = await apiFetch<BackendAuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
  return adaptAuthResponse(r)
}

/** Renueva la sesión con el token recién caducado (ventana de gracia en el back).
 *  El token ya no está en localStorage, así que se manda explícito en la cabecera
 *  (apiFetch no lo sobreescribe porque no hay token en storage). Lanza si el back
 *  rechaza la renovación (caducó hace demasiado, usuario anónimo, baneado...). */
export async function refreshSession(expiredToken: string): Promise<AuthResponse> {
  const r = await apiFetch<BackendAuthResponse>('/api/auth/refresh', {
    method: 'POST',
    headers: { Authorization: `Bearer ${expiredToken}` },
  })
  return adaptAuthResponse(r)
}

export async function register(username: string, password: string, anonToken: string | null): Promise<AuthResponse> {
  const r = await apiFetch<BackendAuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password, anonToken }),
  })
  return adaptAuthResponse(r)
}

export async function updateUsername(username: string): Promise<AuthResponse> {
  const r = await apiFetch<BackendAuthResponse>('/api/users/me/username', {
    method: 'PATCH',
    body: JSON.stringify({ username }),
  })
  return adaptAuthResponse(r)
}

// ── Flujo moderadores con 2FA TOTP ─────────────────────────

export async function registerMod(payload: RegisterModPayload): Promise<{ email: string }> {
  await apiFetch<void>('/api/auth/register/mod', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return { email: payload.email }
}

export async function get2faQR(email: string): Promise<string> {
  const response = await apiFetch<{ otpauthUri: string }>(`/api/auth/register/mod/2fa/qr?email=${encodeURIComponent(email)}`, {
    method: 'GET',
  })
  if (!response?.otpauthUri || typeof response.otpauthUri !== 'string') {
    throw new Error('El servidor no ha devuelto la información de QR.')
  }
  return response.otpauthUri
}

export async function verifyModRegistration(payload: VerifyTotpPayload): Promise<void> {
  await apiFetch<void>('/api/auth/register/mod/2fa/qr', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function loginMod(email: string, password: string): Promise<{ challengeId: string }> {
  const r = await apiFetch<{ challengeId: string }>('/api/auth/login/mod', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  if (!r?.challengeId) {
    throw new Error('El servidor no ha devuelto el desafío de login.')
  }
  return { challengeId: r.challengeId }
}

export async function verifyModLogin(challengeId: string, code: string): Promise<AuthResponse> {
  const r = await apiFetch<{ token: string }>('/api/auth/login/mod/2fa/code', {
    method: 'POST',
    body: JSON.stringify({ challengeId, code }),
  })
  if (!r?.token) {
    throw new Error('El servidor no ha devuelto el token.')
  }

  const payload = decodeJWT(r.token)
  if (!payload) {
    throw new Error('No se pudo decodificar el token.')
  }

  return restoreAuthFromToken(r.token) ?? {
    token: r.token,
    user: {
      id: payload.id || payload.sub || '',
      username: payload.username || payload.email || '',
      role: (payload.role as UserRole) || 'MODERATOR',
    },
  }
}
