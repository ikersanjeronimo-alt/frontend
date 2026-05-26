import { useApi } from './useApi'
import { getProfile } from '../services/profile'
import { MOCK_PROFILE } from '../mocks/data'

export function useProfile() {
  return useApi(getProfile, MOCK_PROFILE)
}
