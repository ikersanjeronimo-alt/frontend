import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import type { ReactNode } from 'react'
import * as authService from '../services/auth'
import { authBus } from '../lib/authBus'
import { syncWSAuth } from '../lib/wsClient'
import { tokenStorage } from '../services/storage'
import { decodeJWT } from '../lib/jwt'
import { SessionExpiredModal } from '../components/auth/SessionExpiredModal'
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
  // Token recién caducado de un usuario logueado mientras el modal de "sesión
  // caducada" está abierto (null = cerrado). El ref evita reabrirlo o pisarlo
  // con re-anonimizaciones si llegan más 401 concurrentes.
  const [expiredSession, setExpiredSession] = useState<string | null>(null)
  const expiredRef = useRef<string | null>(null)

  const applySession = useCallback((session: AuthResponse) => {
    tokenStorage.set(session.token)
    setUser({ ...session.user, token: session.token })
    // Reconectar el WS si el token cambió, para que el Principal de la sesión
    // STOMP (y la presencia online) corresponda a la identidad vigente.
    syncWSAuth()
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
          // Verificar que el usuario realmente existe en la BD.
          // Un JWT válido puede tener un username que ya no existe (p.ej. si el
          // nick fue cambiado antes de que el backend emitiera un nuevo token).
          try {
            await authService.getMe()
            if (tokenStorage.get() !== savedToken) return
            if (!cancelled) {
              applySession(restored)
              setIsLoading(false)
            }
            return
          } catch {
            // Token inválido (401 u otro error): limpiar y crear sesión anónima
            tokenStorage.clear()
          }
        } else {
          tokenStorage.clear()
        }
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
    return authBus.onExpired((expiredToken) => {
      // Si ya hay un modal de expiración abierto, ignorar 401 posteriores
      // (peticiones concurrentes) para no reabrirlo ni pisar el token.
      if (expiredRef.current) return

      // El rol viaja en el claim del token caducado (rol del backend:
      // USER/PROFESSIONAL/ADMINISTRATOR/ANON). Solo los usuarios logueados ven
      // el diálogo; los anónimos se renuevan en silencio como hasta ahora.
      const role = expiredToken ? decodeJWT(expiredToken)?.role : undefined
      const wasLoggedIn = !!role && role !== 'ANON'

      if (wasLoggedIn && expiredToken) {
        expiredRef.current = expiredToken
        setExpiredSession(expiredToken)
        return
      }

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
    const session = await authService.updateUsername(username)
    applySession(session)
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

  // "Seguir conectado": renueva el token con el recién caducado (ventana de
  // gracia del back). Si falla, propaga para que el modal muestre el error.
  const renewSession = useCallback(async () => {
    if (!expiredRef.current) return
    const session = await authService.refreshSession(expiredRef.current)
    applySession(session)
    expiredRef.current = null
    setExpiredSession(null)
  }, [applySession])

  // "Salir": cierra sesión (vuelve a anónimo) y descarta el modal.
  const leaveSession = useCallback(() => {
    expiredRef.current = null
    setExpiredSession(null)
    logout()
  }, [logout])

  return (
    <AuthContext.Provider value={{ user, isLoading, login, loginAsMod, loginAsModWithToken, register, updateUsername, logout }}>
      {children}
      {expiredSession && (
        <SessionExpiredModal onStay={renewSession} onLeave={leaveSession} />
      )}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
