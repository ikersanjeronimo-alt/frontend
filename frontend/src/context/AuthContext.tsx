import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import * as authService from '../services/auth'
import { isNetworkError } from '../services/api'
import { ALLOW_MOCK_FALLBACK } from '../lib/env'
import { markDemoMode } from '../lib/demoMode'
import type { LoginModChallenge } from '../types/api'

export type UserRole = 'ANON' | 'USER' | 'MODERATOR' | 'ADMIN'

export interface AuthUser {
  id: string
  username: string
  role: UserRole
  token: string
}

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  updateUsername: (username: string) => Promise<void>
  login: (username: string, password: string) => Promise<void>
  /** Paso 1 del login mod: valida email+password y devuelve un challenge para el 2FA. NO loguea aún. */
  loginAsMod: (email: string, password: string) => Promise<LoginModChallenge>
  /** Paso 2 del login mod: valida el código TOTP y loguea al usuario si OK. */
  verifyLoginAsMod: (challengeId: string, code: string) => Promise<void>
  register: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const TOKEN_KEY = 'sys_token'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Inicialización: pedir identidad anónima al back. Si está caído y estamos en
  // modo demo (ALLOW_MOCK_FALLBACK), creamos identidad local; si no, dejamos al
  // usuario sin sesión y propagamos el error al UI (banner global).
  useEffect(() => {
    let cancelled = false
    const init = async () => {
      try {
        const { token, user: u } = await authService.initAnonymous()
        if (cancelled) return
        localStorage.setItem(TOKEN_KEY, token)
        setUser({ ...u, token })
      } catch {
        if (cancelled) return
        if (ALLOW_MOCK_FALLBACK) {
          markDemoMode()
          const mock = createMockAnonUser()
          localStorage.setItem(TOKEN_KEY, mock.token)
          setUser(mock)
        }
        // si no, user queda en null y las pantallas dependientes lo gestionan
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    init()
    return () => { cancelled = true }
  }, [])

  // El apiFetch dispara este evento si el back devuelve 401 fuera del flujo de auth.
  useEffect(() => {
    const onExpired = () => {
      if (!ALLOW_MOCK_FALLBACK) {
        // En modo no-demo: borramos sesión y dejamos null. La app reaccionará
        // (rutas protegidas redirigen, ANON queda sin acceso).
        setUser(null)
        return
      }
      markDemoMode()
      const mock = createMockAnonUser()
      localStorage.setItem(TOKEN_KEY, mock.token)
      setUser(mock)
    }
    window.addEventListener('auth:expired', onExpired)
    return () => window.removeEventListener('auth:expired', onExpired)
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    try {
      const { token, user: u } = await authService.login(username, password)
      localStorage.setItem(TOKEN_KEY, token)
      setUser({ ...u, token })
    } catch (e) {
      if (!isNetworkError(e) || !ALLOW_MOCK_FALLBACK) throw e
      markDemoMode()
      const mock = createMockUserFromCredentials(username)
      localStorage.setItem(TOKEN_KEY, mock.token)
      setUser(mock)
    }
  }, [])

  const loginAsMod = useCallback(async (email: string, password: string) => {
    // Login de moderador en dos pasos por el 2FA. Este primer paso valida
    // credenciales y devuelve un challengeId; no toca todavía la sesión.
    // El fallback al mock vive dentro de services/auth.ts.
    return authService.loginMod(email, password)
  }, [])

  const verifyLoginAsMod = useCallback(async (challengeId: string, code: string) => {
    const { token, user: u } = await authService.verifyModLogin({ challengeId, code })
    localStorage.setItem(TOKEN_KEY, token)
    setUser({ ...u, token })
  }, [])

  const register = useCallback(async (username: string, password: string) => {
    try {
      const anonToken = localStorage.getItem(TOKEN_KEY)
      const { token, user: u } = await authService.register(username, password, anonToken)
      localStorage.setItem(TOKEN_KEY, token)
      setUser({ ...u, token })
    } catch (e) {
      if (!isNetworkError(e) || !ALLOW_MOCK_FALLBACK) throw e
      markDemoMode()
      const mock = createMockUserFromCredentials(username)
      localStorage.setItem(TOKEN_KEY, mock.token)
      setUser(mock)
    }
  }, [])

  const updateUsername = useCallback(async (username: string) => {
    // Optimistic con rollback. Errores de red se silencian solo en modo demo;
    // errores del servidor propagan al UI para que el usuario los vea.
    const previous = user?.username
    setUser(prev => prev ? { ...prev, username } : null)
    try {
      await authService.updateUsername(username)
    } catch (e) {
      if (isNetworkError(e) && ALLOW_MOCK_FALLBACK) { markDemoMode(); return }
      if (previous) setUser(prev => prev ? { ...prev, username: previous } : null)
      throw e
    }
  }, [user?.username])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    // Re-iniciar sesión anónima en background.
    authService.initAnonymous()
      .then(({ token, user: u }) => {
        localStorage.setItem(TOKEN_KEY, token)
        setUser({ ...u, token })
      })
      .catch(() => {
        if (!ALLOW_MOCK_FALLBACK) { setUser(null); return }
        markDemoMode()
        const mock = createMockAnonUser()
        localStorage.setItem(TOKEN_KEY, mock.token)
        setUser(mock)
      })
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoading, login, loginAsMod, verifyLoginAsMod, register, updateUsername, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}

function randomUsername(): string {
  const num = Math.floor(Math.random() * 9000) + 1000
  return `anonimo${num}`
}

function createMockAnonUser(): AuthUser {
  return {
    id:       crypto.randomUUID(),
    username: randomUsername(),
    role:     'ANON',
    token:    `mock_${crypto.randomUUID()}`,
  }
}

/**
 * Construye un usuario mock cuando el backend está caído. Solo se usa como
 * fallback para que el front funcione en local sin back. El rol asumido es
 * USER — la app de moderación pasa por /loginmod (con back real obligatorio).
 */
function createMockUserFromCredentials(username: string): AuthUser {
  return {
    id:       crypto.randomUUID(),
    username,
    role:     'USER',
    token:    `mock_${crypto.randomUUID()}`,
  }
}
