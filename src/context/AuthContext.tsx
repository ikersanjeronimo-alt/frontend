import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import * as authService from '../services/auth'
import { authBus } from '../lib/authBus'
import { tokenStorage } from '../services/storage'
import type { ApiUser, AuthResponse } from '../types/api'

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

  const applySession = useCallback((session: AuthResponse) => {
    tokenStorage.set(session.token)
    setUser({ ...session.user, token: session.token })
  }, [])

  useEffect(() => {
    let cancelled = false
    const initialToken = tokenStorage.get()
    const init = async () => {
      // Si hay token guardado, RESTAURAR la sesión real (cualquier rol) a partir
      // de los claims del token. Antes se pedía siempre identidad anónima, lo que
      // degradaba a usuarios/mods logueados a anónimo en cada recarga.
      const savedToken = tokenStorage.get()
      if (savedToken) {
        const restored = authService.restoreAuthFromToken(savedToken)
        if (restored) {
          if (tokenStorage.get() !== savedToken) return
          if (!cancelled) {
            applySession(restored)
            setIsLoading(false)
          }
          return
        }
        tokenStorage.clear()
      }

      try {
        const anon = await authService.initAnonymous()
        if (cancelled) return
        if (tokenStorage.get() !== initialToken) return
        applySession(anon)
      } catch {
        if (!cancelled) {
          setUser(null)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    init()
    return () => { cancelled = true }
  }, [applySession])

  useEffect(() => {
    return authBus.onExpired(() => {
      tokenStorage.clear()
      void (async () => {
        try {
          const anon = await authService.initAnonymous()
          applySession(anon)
        } catch {
          setUser(null)
        }
      })()
    })
  }, [applySession])

  const login = useCallback(async (username: string, password: string) => {
    const session = await authService.login(username, password)
    applySession(session)
  }, [applySession])

  const loginAsMod = useCallback(async (email: string, password: string) => {
    await authService.loginMod(email, password)
  }, [])

  const loginAsModWithToken = useCallback((token: string, userInfo: ApiUser) => {
    applySession({ token, user: userInfo })
  }, [applySession])

  const register = useCallback(async (username: string, password: string) => {
    const anonToken = tokenStorage.get()
    const session = await authService.register(username, password, anonToken)
    applySession(session)
  }, [applySession])

  const updateUsername = useCallback(async (username: string) => {
    try {
      const session = await authService.updateUsername(username)
      applySession(session)
    } catch (e) {
      throw e
    }
  }, [applySession])

  const logout = useCallback(() => {
    tokenStorage.clear()
    void (async () => {
      try {
        const anon = await authService.initAnonymous()
        applySession(anon)
      } catch {
        setUser(null)
      }
    })()
  }, [applySession])

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
