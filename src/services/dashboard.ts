import { apiFetch } from './api'
import type { ApiDashboardMessage } from '../types/api'

export function getRecentMessages(): Promise<ApiDashboardMessage[]> {
  return apiFetch<ApiDashboardMessage[]>('/api/users/me/dashboard/messages')
}
