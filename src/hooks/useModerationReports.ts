import { useApi } from './useApi'
import { getReports } from '../services/moderation'
import type { ApiReport } from '../types/api'

const EMPTY: ApiReport[] = []

export function useModerationReports() {
  return useApi(
    getReports,
    EMPTY,
    () => import('../mocks/data').then(m => m.MOCK_REPORTS),
  )
}
