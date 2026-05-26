import { useApi } from './useApi'
import { getRecentMessages } from '../services/dashboard'
import { MOCK_DASHBOARD_MESSAGES } from '../mocks/data'

export function useDashboardMessages() {
  return useApi(getRecentMessages, MOCK_DASHBOARD_MESSAGES)
}
