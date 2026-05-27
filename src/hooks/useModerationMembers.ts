import { useApi } from './useApi'
import { getModerationMembers } from '../services/moderation'
import type { ApiModerationMember } from '../types/api'

const EMPTY: ApiModerationMember[] = []

export function useModerationMembers() {
  return useApi(getModerationMembers, EMPTY)
}
