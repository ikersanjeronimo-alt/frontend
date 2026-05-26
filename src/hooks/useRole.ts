import { useAuth } from '../context/AuthContext'
import { canModerate, canAdminister, isAnon, isLoggedIn } from '../lib/roles'

/**
 * Hook conveniencia para los flags de rol más usados. Cualquier cambio en el
 * user del contexto re-renderiza el consumidor (ya lo hace useAuth).
 */
export function useRole() {
  const { user } = useAuth()
  return {
    user,
    isMod:        canModerate(user),
    isAdmin:      canAdminister(user),
    isAnon:       isAnon(user),
    isLoggedIn:   isLoggedIn(user),
  }
}
