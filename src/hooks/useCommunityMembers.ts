import { useApi } from './useApi'
import { getActiveMembers } from '../services/communities'
import type { ApiChatMember } from '../types/api'

const EMPTY: ApiChatMember[] = []

export function useCommunityMembers(communityId: string, deps: unknown[] = []) {
  return useApi(
    () => (communityId ? getActiveMembers(communityId) : Promise.resolve(EMPTY)),
    EMPTY,
    [communityId, ...deps],
  )
}
