import { useApi } from './useApi'
import { getCommunities } from '../services/communities'
import type { ApiCommunity } from '../types/api'

const EMPTY: ApiCommunity[] = []

export function useCommunities() {
  return useApi(
    getCommunities,
    EMPTY,
    () => import('../mocks/data').then(m => m.MOCK_COMMUNITIES),
  )
}
