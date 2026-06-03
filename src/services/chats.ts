import { apiFetch } from './api'
import type { ApiPrivateConversation, ApiPrivateMessage } from '../types/api'

export function getPrivateChat(professionalId: string): Promise<ApiPrivateMessage[]> {
  return apiFetch<ApiPrivateMessage[]>(`/api/chats/${professionalId}/messages`)
}

export function sendPrivateMessage(professionalId: string, text: string): Promise<ApiPrivateMessage> {
  return apiFetch<ApiPrivateMessage>(`/api/chats/${professionalId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ text }),
  })
}

export function getProfessionalInbox(): Promise<ApiPrivateConversation[]> {
  return apiFetch<ApiPrivateConversation[]>('/api/chats/inbox')
}

export function getProfessionalInboxMessages(userId: string): Promise<ApiPrivateMessage[]> {
  return apiFetch<ApiPrivateMessage[]>(`/api/chats/inbox/${userId}/messages`)
}

export function sendProfessionalInboxMessage(userId: string, text: string): Promise<ApiPrivateMessage> {
  return apiFetch<ApiPrivateMessage>(`/api/chats/inbox/${userId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ text }),
  })
}
