import { useApi } from './useApi'
import { getProfile } from '../services/profile'
import type { ApiProfile } from '../types/api'

// Perfil vacío que se muestra durante el primer load (loading: true) y si la
// API falla sin fallback al mock. Las pantallas lo gestionan vía `loading`/`error`.
const EMPTY_PROFILE: ApiProfile = {
  username: '',
  role: 'ANON',
  joinedAt: new Date().toISOString().slice(0, 10),
  stats: { messages: 0, communities: 0, events: 0, stories: 0, bottles: 0 },
  activity: [],
  topics: [],
}

export function useProfile() {
  return useApi(
    getProfile,
    EMPTY_PROFILE,
    () => import('../mocks/data').then(m => m.MOCK_PROFILE),
  )
}
