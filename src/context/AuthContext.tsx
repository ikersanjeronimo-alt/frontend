import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import * as authService from '../services/auth'
import { authBus } from '../lib/authBus'
import { tokenStorage } from '../services/storage'
import type { ApiUser } from '../types/api'

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
  /** Validar email+password y navegar a 2FA. NO loguea aún. */
  loginAsMod: (email: string, password: string) => Promise<void>
  /** Loguear directamente con token (después de validar código TOTP). */
  loginAsModWithToken: (token: string, userInfo: ApiUser) => void
  register: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Inicialización: pedir identidad anónima al back.
  // Si falla, user queda en null y las pantallas dependientes lo gestionan.
  useEffect(() => {
    let cancelled = false
    const init = async () => {
      try {
        // Si hay token guardado, RESTAURAR la sesión real (cualquier rol). Antes
        // se pedía siempre identidad anónima, lo que degradaba a usuarios/mods
        // logueados a anónimo en cada recarga.
        const saved = tokenStorage.get()
        if (saved) {
          try {
            const u = await authService.getMe()
            if (cancelled) return
            setUser({ ...u, token: saved })
            return
          } catch {
            // token inválido/expirado → continuar a identidad anónima
          }
        }
        const { token, user: u } = await authService.initAnonymous()
        if (cancelled) return
        tokenStorage.set(token)
        setUser({ ...u, token })
      } catch {
        // back caído o error: user queda en null
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    init()
    return () => { cancelled = true }
  }, [])

  // El apiFetch dispara este evento si el back devuelve 401 fuera del flujo
  // de auth. El bus tiene buffer, así que si el 401 llegó antes de que este
  // effect montara, lo recibimos en el primer subscribe.
  useEffect(() => {
    return authBus.onExpired(() => {
      tokenStorage.clear()
      setUser(null)
    })
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    const { token, user: u } = await authService.login(username, password)
    tokenStorage.set(token)
    setUser({ ...u, token })
  }, [])

  const loginAsMod = useCallback(async (email: string, password: string) => {
    await authService.loginMod(email, password)
  }, [])

  const loginAsModWithToken = useCallback((token: string, userInfo: ApiUser) => {
    tokenStorage.set(token)
    setUser({ ...userInfo, token })
  }, [])

  const register = useCallback(async (username: string, password: string) => {
    const anonToken = tokenStorage.get()
    const { token, user: u } = await authService.register(username, password, anonToken)
    tokenStorage.set(token)
    setUser({ ...u, token })
  }, [])

  const updateUsername = useCallback(async (username: string) => {
    const previous = user?.username
    setUser(prev => prev ? { ...prev, username } : null)
    try {
      await authService.updateUsername(username)
    } catch (e) {
      if (previous) setUser(prev => prev ? { ...prev, username: previous } : null)
      throw e
    }
  }, [user?.username])

  const logout = useCallback(() => {
    tokenStorage.clear()
    authService.initAnonymous()
      .then(({ token, user: u }) => {
        tokenStorage.set(token)
        setUser({ ...u, token })
      })
      .catch(() => {
        setUser(null)
      })
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoading, login, loginAsMod, loginAsModWithToken, register, updateUsername, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
