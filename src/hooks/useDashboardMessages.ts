import { useApi } from './useApi'
import { getRecentMessages } from '../services/dashboard'
import type { ApiDashboardMessage } from '../types/api'

const EMPTY: ApiDashboardMessage[] = []

export function useDashboardMessages() {
  return useApi(getRecentMessages, EMPTY)
}
