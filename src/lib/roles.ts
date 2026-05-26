import type { AuthUser, UserRole } from '../context/AuthContext'

/**
 * Helpers puros sobre el rol del usuario actual. Reciben `AuthUser | null` y
 * devuelven boolean — pueden usarse desde React (vía useRole) o desde código
 * no-React (services, guards) sin acoplarse al árbol de componentes.
 */

export function canModerate(u: AuthUser | null): boolean {
  return u?.role === 'MODERATOR' || u?.role === 'ADMIN'
}

export function canAdminister(u: AuthUser | null): boolean {
  return u?.role === 'ADMIN'
}

export function isAnon(u: AuthUser | null): boolean {
  return !u || u.role === 'ANON'
}

/** Sesión "completa" (no anónima ni desconectada). USER, MOD o ADMIN. */
export function isLoggedIn(u: AuthUser | null): boolean {
  return !!u && u.role !== 'ANON'
}

export const MOD_ROLES: UserRole[] = ['MODERATOR', 'ADMIN']
