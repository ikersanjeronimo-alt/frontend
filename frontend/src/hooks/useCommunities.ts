import { useApi } from './useApi'
import { getCommunities } from '../services/communities'
import { MOCK_COMMUNITIES } from '../mocks/data'

export function useCommunities() {
  return useApi(getCommunities, MOCK_COMMUNITIES)
}
