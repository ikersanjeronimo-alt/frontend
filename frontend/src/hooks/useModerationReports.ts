import { useApi } from './useApi'
import { getReports } from '../services/moderation'
import { MOCK_REPORTS } from '../mocks/data'

export function useModerationReports() {
  return useApi(getReports, MOCK_REPORTS)
}
