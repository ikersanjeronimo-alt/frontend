import { apiFetch, isNetworkError } from './api'
import { tokenStorage } from './storage'
import { ALLOW_MOCK_FALLBACK } from '../lib/env'
import { markDemoMode } from '../lib/demoMode'
import {
  generateMockEnrollment,
  verifyMockCode,
  getMockAccount,
  hasMockAccount,
} from '../lib/totp'
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
// Mientras el back no soporte 2FA, este módulo simula los 4 endpoints desde
// el front (ver lib/totp.ts). El contrato HTTP queda fijado para que el
// reemplazo sea solo "borrar el catch del mock fallback".

/**
 * Registro de moderador/admin. Devuelve el secreto + otpauth URI para que el
 * usuario escanee el QR con Google Authenticator. La cuenta queda "pendiente"
 * hasta que se llame a `verifyModRegistration` con el primer código.
 *
 * Caemos al mock TOTP en dos casos:
 *  - El back está caído (network error).
 *  - El back responde OK pero sin el body esperado — caso típico: la versión
 *    actual devuelve 204 No Content porque todavía no soporta 2FA. Cuando el
 *    back devuelva `{secret, otpauthUri}`, esta rama deja de entrarse sola.
 */
function mockEnrollment(payload: RegisterModPayload): RegisterModEnrollment {
  markDemoMode()
  const role = payload.role === 'PROFESSIONAL' ? 'MODERATOR' : 'ADMIN'
  const { secret, otpauthUri } = generateMockEnrollment(payload.email, payload.username, role)
  return { secret, otpauthUri, email: payload.email }
}

export async function registerMod(payload: RegisterModPayload): Promise<RegisterModEnrollment> {
  try {
    const r = await apiFetch<{ secret?: string; otpauthUri?: string } | undefined>(
      '/api/auth/register/mod',
      { method: 'POST', body: JSON.stringify(payload) },
    )
    if (!r || !r.secret || !r.otpauthUri) {
      if (!ALLOW_MOCK_FALLBACK) {
        throw new Error('El servidor no ha devuelto la información de 2FA.')
      }
      return mockEnrollment(payload)
    }
    return { secret: r.secret, otpauthUri: r.otpauthUri, email: payload.email }
  } catch (e) {
    if (!isNetworkError(e) || !ALLOW_MOCK_FALLBACK) throw e
    return mockEnrollment(payload)
  }
}

/**
 * Tipo de "decisión" tras pasar por el try/catch del back: o bien se completó
 * con el back y devolvemos `done`, o bien tenemos que tirar de mock. Sacamos
 * los `throw new Error` del bloque `catch (e)` para que el linter
 * `preserve-caught-error` no chille (no queremos arrastrar el network error
 * original como `cause` del error de validación del mock — son cosas distintas).
 */
type BackOrMock<T> = { kind: 'done'; value: T } | { kind: 'fallback' }

/**
 * Confirma el enrolamiento con el primer código de 6 dígitos. Sin esta llamada
 * la cuenta no debería poder hacer login.
 */
export async function verifyModRegistration(payload: VerifyTotpPayload): Promise<void> {
  let decision: BackOrMock<void>
  try {
    await apiFetch<void>('/api/auth/register/mod/verify', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    decision = { kind: 'done', value: undefined }
  } catch (e) {
    if (!isNetworkError(e) || !ALLOW_MOCK_FALLBACK) throw e
    markDemoMode()
    decision = { kind: 'fallback' }
  }
  if (decision.kind === 'done') return
  if (!verifyMockCode(payload.email, payload.code)) {
    throw new Error('Código incorrecto. Vuelve a comprobarlo en la app.')
  }
}

// Mapa en memoria de challenges en curso (solo modo demo). Si el usuario
// recarga la página entre paso 1 y 2, el challenge se pierde y tiene que
// reintroducir email/password — comportamiento esperado para 2FA.
const mockChallenges = new Map<string, { email: string }>()

/**
 * Paso 1 del login de moderador: valida email+password. NO devuelve token;
 * devuelve un challengeId que hay que pasar a `verifyModLogin` junto con el
 * código de 6 dígitos.
 */
export async function loginMod(email: string, password: string): Promise<LoginModChallenge> {
  let decision: BackOrMock<LoginModChallenge>
  try {
    const r = await apiFetch<{ challengeId: string; requires2fa: true }>(
      '/api/auth/login/mod',
      { method: 'POST', body: JSON.stringify({ email, password }) },
    )
    decision = { kind: 'done', value: { requires2fa: true, challengeId: r.challengeId } }
  } catch (e) {
    if (!isNetworkError(e) || !ALLOW_MOCK_FALLBACK) throw e
    markDemoMode()
    decision = { kind: 'fallback' }
  }
  if (decision.kind === 'done') return decision.value
  if (!hasMockAccount(email)) {
    throw new Error('No existe ninguna cuenta con ese email. Regístrate primero.')
  }
  // En modo demo no validamos password (es coherente con el resto de mocks).
  const challengeId = crypto.randomUUID()
  mockChallenges.set(challengeId, { email })
  return { requires2fa: true, challengeId }
}

/**
 * Paso 2 del login de moderador: valida el código de 6 dígitos. Si OK,
 * devuelve token + user listos para meter en el AuthContext.
 */
export async function verifyModLogin(payload: VerifyLoginPayload): Promise<AuthResponse> {
  let decision: BackOrMock<AuthResponse>
  try {
    const r = await apiFetch<BackendAuthResponse>('/api/auth/login/mod/verify', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    decision = { kind: 'done', value: adaptAuthResponse(r) }
  } catch (e) {
    if (!isNetworkError(e) || !ALLOW_MOCK_FALLBACK) throw e
    markDemoMode()
    decision = { kind: 'fallback' }
  }
  if (decision.kind === 'done') return decision.value
  const pending = mockChallenges.get(payload.challengeId)
  if (!pending) {
    throw new Error('La sesión de login ha caducado. Vuelve a empezar.')
  }
  if (!verifyMockCode(pending.email, payload.code)) {
    throw new Error('Código incorrecto. Vuelve a comprobarlo en la app.')
  }
  const account = getMockAccount(pending.email)
  if (!account) {
    throw new Error('La cuenta ya no existe.')
  }
  mockChallenges.delete(payload.challengeId)
  return {
    token: `mock_${crypto.randomUUID()}`,
    user: { id: account.id, username: account.username, role: account.role },
  }
}
