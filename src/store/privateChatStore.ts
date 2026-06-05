import { create } from 'zustand'
import type { ApiPrivateMessage } from '../types/api'

interface PrivateChatState {
  // ── Lado usuario: conversación identificada por professionalId ─────────────
  messages: Record<string, ApiPrivateMessage[]>
  setMessages: (professionalId: string, messages: ApiPrivateMessage[]) => void
  addMessage: (professionalId: string, message: ApiPrivateMessage) => void
  removeMessage: (professionalId: string, messageId: string) => void

  // ── Lado profesional: conversación identificada por userId ─────────────────
  inboxMessages: Record<string, ApiPrivateMessage[]>
  /** Último mensaje recibido por userId — permite al hook actualizar el sidebar. */
  inboxLastMessages: Record<string, ApiPrivateMessage>
  setInboxMessages: (userId: string, messages: ApiPrivateMessage[]) => void
  addInboxMessage: (userId: string, message: ApiPrivateMessage) => void
  removeInboxMessage: (userId: string, messageId: string) => void
}

export const usePrivateChatStore = create<PrivateChatState>((set) => ({
  // ── Usuario ────────────────────────────────────────────────────────────────
  messages: {},
  setMessages: (professionalId, messages) =>
    set(state => ({ messages: { ...state.messages, [professionalId]: messages } })),
  addMessage: (professionalId, message) =>
    set(state => {
      const existing = state.messages[professionalId] ?? []
      if (existing.some(m => m.id === message.id)) return state
      return { messages: { ...state.messages, [professionalId]: [...existing, message] } }
    }),
  removeMessage: (professionalId, messageId) =>
    set(state => ({
      messages: {
        ...state.messages,
        [professionalId]: (state.messages[professionalId] ?? []).filter(m => m.id !== messageId),
      },
    })),

  // ── Profesional (inbox) ────────────────────────────────────────────────────
  inboxMessages: {},
  inboxLastMessages: {},
  setInboxMessages: (userId, messages) =>
    set(state => ({ inboxMessages: { ...state.inboxMessages, [userId]: messages } })),
  addInboxMessage: (userId, message) =>
    set(state => {
      const existing = state.inboxMessages[userId] ?? []
      if (existing.some(m => m.id === message.id)) return state
      return {
        inboxMessages: { ...state.inboxMessages, [userId]: [...existing, message] },
        inboxLastMessages: { ...state.inboxLastMessages, [userId]: message },
      }
    }),
  removeInboxMessage: (userId, messageId) =>
    set(state => ({
      inboxMessages: {
        ...state.inboxMessages,
        [userId]: (state.inboxMessages[userId] ?? []).filter(m => m.id !== messageId),
      },
    })),
}))
