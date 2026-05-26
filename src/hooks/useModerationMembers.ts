import { useApi } from './useApi'
import { getModerationMembers } from '../services/moderation'
import { MOCK_MOD_MEMBERS } from '../mocks/data'

export function useModerationMembers() {
  return useApi(getModerationMembers, MOCK_MOD_MEMBERS)
}
