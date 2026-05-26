import { apiFetch } from './api'
import type { ApiReport, ApiModerationMember } from '../types/api'

export function getReports(): Promise<ApiReport[]> {
  return apiFetch<ApiReport[]>('/api/reports')
}

export function updateReport(id: string, status: 'resolved' | 'dismissed'): Promise<ApiReport> {
  return apiFetch<ApiReport>(`/api/reports/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export function getModerationMembers(): Promise<ApiModerationMember[]> {
  return apiFetch<ApiModerationMember[]>('/api/moderation/members')
}
