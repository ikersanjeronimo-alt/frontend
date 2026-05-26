import { useApi } from './useApi'
import { getProfessionals } from '../services/professionals'
import { MOCK_PROFESSIONALS } from '../mocks/data'

export function useProfessionals() {
  return useApi(getProfessionals, MOCK_PROFESSIONALS)
}
