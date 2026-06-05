import { useApi } from './useApi'
import { getActiveMembers } from '../services/communities'
import type { ApiChatMember } from '../types/api'

const EMPTY: ApiChatMember[] = []

export function useCommunityMembers(communityId: string, deps: unknown[] = []) {
  if (!communityId) {
    return { data: EMPTY, loading: false, error: null }
  }
  return useApi(
    () => getActiveMembers(communityId),
    EMPTY,
    [communityId, ...deps],
  )
}
