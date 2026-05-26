import { useApi } from './useApi'
import { getActiveMembers } from '../services/communities'
import { MOCK_CHAT_MEMBERS } from '../mocks/data'

export function useCommunityMembers(communityId: string) {
  return useApi(() => getActiveMembers(communityId), MOCK_CHAT_MEMBERS, [communityId])
}
