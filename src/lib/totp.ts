import * as OTPAuth from 'otpauth'
import { modAccountStorage } from '../services/storage'

/**
 * Helpers de TOTP para el flujo de moderadores/administradores.
 *
 * Mientras el backend no soporte 2FA, simulamos el lado servidor desde el
 * front (genera secret, lo persiste en localStorage por email, valida códigos
 * con otpauth). Cuando el back lo asuma, este módulo deja de usarse desde
 * services/auth.ts; el front solo renderiza el QR que le dé el back y manda
 * el código de 6 dígitos para validar.
 *
 * Contrato que el backend tendrá que devolver:
 *  - POST /api/auth/register/mod  →  { secret: string, otpauthUri: string }
 *  - POST /api/auth/register/mod/verify  body { email, code }  →  204
 *  - POST /api/auth/login/mod  →  { challengeId: string, requires2fa: true }
 *  - POST /api/auth/login/mod/verify  body { challengeId, code }  →  AuthResponse
 */

const ISSUER = 'ShareYourStory'

export type StoredModRole = 'MODERATOR' | 'ADMIN'

interface StoredAccount {
  id: string
  username: string
  role: StoredModRole
  secret: string
}

function isStoredAccount(v: unknown): v is StoredAccount {
  if (!v || typeof v !== 'object') return false
  const a = v as Record<string, unknown>
  return typeof a.id === 'string'
      && typeof a.username === 'string'
      && (a.role === 'MODERATOR' || a.role === 'ADMIN')
      && typeof a.secret === 'string'
}

function buildTotp(email: string, secret: OTPAuth.Secret): OTPAuth.TOTP {
  return new OTPAuth.TOTP({
    issuer: ISSUER,
    label: email,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret,
  })
}

/**
 * Crea (o reemplaza) el enrolamiento TOTP de un email. Devuelve el otpauth://
 * URI para pintar el QR y el secreto en Base32 (para mostrarlo como fallback
 * si el usuario no puede escanear).
 */
export function generateMockEnrollment(
  email: string,
  username: string,
  role: StoredModRole,
): { secret: string; otpauthUri: string } {
  const rawSecret = new OTPAuth.Secret({ size: 20 })
  const totp = buildTotp(email, rawSecret)

  const account: StoredAccount = {
    id: crypto.randomUUID(),
    username,
    role,
    secret: rawSecret.base32,
  }
  modAccountStorage.set(email, account)

  return { secret: rawSecret.base32, otpauthUri: totp.toString() }
}

/**
 * Valida un código de 6 dígitos contra el secreto guardado para ese email.
 * Acepta una ventana de ±1 step (30s) para tolerar desfase horario.
 */
export function verifyMockCode(email: string, code: string): boolean {
  const account = getMockAccount(email)
  if (!account) return false
  const secret = OTPAuth.Secret.fromBase32(account.secret)
  const totp = buildTotp(email, secret)
  const delta = totp.validate({ token: code, window: 1 })
  return delta !== null
}

export function getMockAccount(email: string): StoredAccount | null {
  return modAccountStorage.get(email, isStoredAccount)
}

export function hasMockAccount(email: string): boolean {
  return getMockAccount(email) !== null
}
