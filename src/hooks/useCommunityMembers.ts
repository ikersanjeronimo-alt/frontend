import { useApi } from './useApi'
import { getActiveMembers } from '../services/communities'
import type { ApiChatMember } from '../types/api'

const EMPTY: ApiChatMember[] = []

export function useCommunityMembers(communityId: string) {
  return useApi(
    () => getActiveMembers(communityId),
    EMPTY,
    () => import('../mocks/data').then(m => m.MOCK_CHAT_MEMBERS),
    [communityId],
  )
}
