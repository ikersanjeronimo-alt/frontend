import { useApi } from './useApi'
import { getModerationStaff } from '../services/moderation'
import type { ApiStaffMember } from '../types/api'

const EMPTY: ApiStaffMember[] = []

export function useModerationStaff() {
  return useApi(getModerationStaff, EMPTY)
}
