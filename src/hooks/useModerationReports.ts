import { useApi } from './useApi'
import { getReports } from '../services/moderation'
import type { ApiReport } from '../types/api'

const EMPTY: ApiReport[] = []

// `reloadKey` permite recargar la lista cuando llega un aviso WS de reporte nuevo.
export function useModerationReports(reloadKey = 0) {
  return useApi(getReports, EMPTY, [reloadKey])
}
