import { apiFetch } from './api'
import type { ApiCommunity, ApiMessage, ApiChatMember } from '../types/api'

export function getCommunities(): Promise<ApiCommunity[]> {
  return apiFetch<ApiCommunity[]>('/api/communities')
}

export function joinCommunity(id: string): Promise<void> {
  return apiFetch<void>(`/api/communities/${id}/join`, { method: 'POST' })
}

export function leaveCommunity(id: string): Promise<void> {
  return apiFetch<void>(`/api/communities/${id}/join`, { method: 'DELETE' })
}

export function getMessages(communityId: string): Promise<ApiMessage[]> {
  return apiFetch<ApiMessage[]>(`/api/communities/${communityId}/messages`)
}

export function sendMessage(communityId: string, text: string): Promise<ApiMessage> {
  return apiFetch<ApiMessage>(`/api/communities/${communityId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ text }),
  })
}

export function getActiveMembers(communityId: string): Promise<ApiChatMember[]> {
  return apiFetch<ApiChatMember[]>(`/api/communities/${communityId}/members/active`)
}
