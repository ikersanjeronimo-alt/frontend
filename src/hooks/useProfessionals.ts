import { useApi } from './useApi'
import { getProfessionals } from '../services/professionals'
import type { ApiProfessional } from '../types/api'

const EMPTY: ApiProfessional[] = []

export function useProfessionals() {
  return useApi(
    getProfessionals,
    EMPTY,
    () => import('../mocks/data').then(m => m.MOCK_PROFESSIONALS),
  )
}
