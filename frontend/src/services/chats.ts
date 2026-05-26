import { apiFetch } from './api'
import type { ApiPrivateMessage } from '../types/api'

export function getPrivateChat(professionalId: string): Promise<ApiPrivateMessage[]> {
  return apiFetch<ApiPrivateMessage[]>(`/api/chats/${professionalId}/messages`)
}

export function sendPrivateMessage(professionalId: string, text: string): Promise<ApiPrivateMessage> {
  return apiFetch<ApiPrivateMessage>(`/api/chats/${professionalId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ text }),
  })
}
