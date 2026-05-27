import { apiFetch } from './api'
import { tokenStorage } from './storage'
import type {
  AuthResponse,
  ApiUser,
  UserRole,
  RegisterModPayload,
  RegisterModEnrollment,
  LoginModChallenge,
  VerifyTotpPayload,
  VerifyLoginPayload,
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

// ── Endpoints ──────────────────────────────────────────────

export async function initAnonymous(): Promise<AuthResponse> {
  const savedToken = tokenStorage.get()
  const r = await apiFetch<BackendAuthResponse>('/api/auth/anonymous', {
    method: 'POST',
    body: JSON.stringify({ anonToken: savedToken ?? null }),
  })
  return adaptAuthResponse(r)
}

export async function login(username: string, password: string): Promise<AuthResponse> {
  const r = await apiFetch<BackendAuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
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

export async function updateUsername(username: string): Promise<void> {
  await apiFetch<void>('/api/users/me/username', {
    method: 'PATCH',
    body: JSON.stringify({ username }),
  })
}

// ── Flujo moderadores con 2FA TOTP ─────────────────────────

export async function registerMod(payload: RegisterModPayload): Promise<RegisterModEnrollment> {
  const r = await apiFetch<{ secret: string; otpauthUri: string }>(
    '/api/auth/register/mod',
    { method: 'POST', body: JSON.stringify(payload) },
  )
  if (!r?.secret || !r?.otpauthUri) {
    throw new Error('El servidor no ha devuelto la información de 2FA.')
  }
  return { secret: r.secret, otpauthUri: r.otpauthUri, email: payload.email }
}

export async function verifyModRegistration(payload: VerifyTotpPayload): Promise<void> {
  await apiFetch<void>('/api/auth/register/mod/verify', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function loginMod(email: string, password: string): Promise<LoginModChallenge> {
  const r = await apiFetch<{ challengeId: string; requires2fa: true }>(
    '/api/auth/login/mod',
    { method: 'POST', body: JSON.stringify({ email, password }) },
  )
  return { requires2fa: true, challengeId: r.challengeId }
}

export async function verifyModLogin(payload: VerifyLoginPayload): Promise<AuthResponse> {
  const r = await apiFetch<BackendAuthResponse>('/api/auth/login/mod/verify', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return adaptAuthResponse(r)
}
