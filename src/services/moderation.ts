import { apiFetch } from './api'
import type { ApiReport, ApiModerationMember } from '../types/api'

export function getReports(): Promise<ApiReport[]> {
  return apiFetch<ApiReport[]>('/api/moderation/reports')
}

export type ReportAction = 'resolve' | 'warn' | 'dismiss'

export function updateReport(id: string, action: ReportAction): Promise<unknown> {
  return apiFetch<unknown>(`/api/moderation/reports/${id}/resolve`, {
    method: 'POST',
    body: JSON.stringify({ action }),
  })
}

export function reportStory(storyId: string, reason: string): Promise<unknown> {
  return apiFetch<unknown>('/api/moderation/reports', {
    method: 'POST',
    body: JSON.stringify({ storyId: Number(storyId), reason }),
  })
}

export function reportMessage(messageId: string, reason: string): Promise<unknown> {
  return apiFetch<unknown>('/api/moderation/reports', {
    method: 'POST',
    body: JSON.stringify({ messageId: Number(messageId), reason }),
  })
}

export function getModerationMembers(): Promise<ApiModerationMember[]> {
  return apiFetch<ApiModerationMember[]>('/api/moderation/members')
}

export function warnMember(id: string): Promise<ApiModerationMember> {
  return apiFetch<ApiModerationMember>(`/api/moderation/members/${id}/warn`, { method: 'POST' })
}

export function banMember(id: string): Promise<ApiModerationMember> {
  return apiFetch<ApiModerationMember>(`/api/moderation/members/${id}/ban`, { method: 'POST' })
}
