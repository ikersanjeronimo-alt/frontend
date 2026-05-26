import { apiFetch } from './api'
import type { ApiProfessional } from '../types/api'

export function getProfessionals(): Promise<ApiProfessional[]> {
  return apiFetch<ApiProfessional[]>('/api/professionals')
}
