import { apiFetch } from './api'
import type { ApiCommunity, ApiMessage, ApiChatMember } from '../types/api'

function normalizeCommunity(c: any): ApiCommunity {
  return {
    id: String(c.id),
    emoji: c.emoji ?? '',
    name: c.name ?? '',
    mod: c.mod ?? '',
    modUserId: c.modUserId != null ? String(c.modUserId) : null,
    desc: c.desc ?? '',
    members: Number(c.members ?? 0),
    online: Number(c.online ?? 0),
    category: String(c.category ?? 'GENERAL'),
    joined: Boolean(c.joined ?? false),
    pinnedNote: c.pinnedNote ?? undefined,
    chatClosed: Boolean(c.chatClosed ?? false),
  }
}

function normalizeMessage(raw: any): ApiMessage {
  const createdAt = raw?.createdAt ? new Date(raw.createdAt) : null
  const time = raw?.time
    ?? (createdAt && !Number.isNaN(createdAt.getTime())
      ? createdAt.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
      : '')

  return {
    id: String(raw?.id ?? ''),
    username: String(raw?.username ?? ''),
    text: String(raw?.text ?? ''),
    time,
    own: Boolean(raw?.own ?? false),
    action: raw?.action === 'DELETE' ? 'DELETE' : undefined,
  }
}

export async function getCommunities(): Promise<ApiCommunity[]> {
  const communities = await apiFetch<any[]>('/api/communities')
  return communities.map(normalizeCommunity)
}

export function joinCommunity(id: string): Promise<ApiCommunity> {
  return apiFetch<any>(`/api/communities/${id}/join`, { method: 'POST' }).then(normalizeCommunity)
}

export function leaveCommunity(id: string): Promise<ApiCommunity> {
  return apiFetch<any>(`/api/communities/${id}/join`, { method: 'DELETE' }).then(normalizeCommunity)
}

export function getMessages(communityId: string): Promise<ApiMessage[]> {
  return apiFetch<any[]>(`/api/communities/${communityId}/messages`).then(messages =>
    messages.map(normalizeMessage),
  )
}

export function sendMessage(communityId: string, text: string): Promise<ApiMessage> {
  return apiFetch<any>(`/api/communities/${communityId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ text }),
  }).then(normalizeMessage)
}

export function getActiveMembers(communityId: string): Promise<ApiChatMember[]> {
  return apiFetch<ApiChatMember[]>(`/api/communities/${communityId}/members/active`)
}

export interface CreateCommunityPayload {
  name: string
  desc: string
  emoji: string
  category: string
  mod: string
  modUserId?: string | null
}

export function createCommunity(payload: CreateCommunityPayload): Promise<ApiCommunity> {
  return apiFetch<any>('/api/communities', {
    method: 'POST',
    body: JSON.stringify(payload),
  }).then(normalizeCommunity)
}

export function deleteCommunityMessage(communityId: string, messageId: string): Promise<void> {
  return apiFetch<void>(`/api/communities/${communityId}/messages/${messageId}`, {
    method: 'DELETE',
  })
}

export function setCommunityPinnedNote(communityId: string, note: string): Promise<ApiCommunity> {
  return apiFetch<any>(`/api/communities/${communityId}/pinned-note`, {
    method: 'PATCH',
    body: JSON.stringify({ note }),
  }).then(normalizeCommunity)
}

export function setCommunityChatClosed(communityId: string, closed: boolean): Promise<ApiCommunity> {
  return apiFetch<any>(`/api/communities/${communityId}/chat-closed`, {
    method: 'PATCH',
    body: JSON.stringify({ closed }),
  }).then(normalizeCommunity)
}

export function kickCommunityMember(communityId: string, userId: string): Promise<ApiCommunity> {
  return apiFetch<any>(`/api/communities/${communityId}/members/${userId}`, {
    method: 'DELETE',
  }).then(normalizeCommunity)
}
