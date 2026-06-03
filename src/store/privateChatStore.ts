import { create } from 'zustand'
import type { ApiPrivateMessage } from '../types/api'

interface PrivateChatState {
  messages: Record<string, ApiPrivateMessage[]>
  setMessages: (professionalId: string, messages: ApiPrivateMessage[]) => void
  addMessage: (professionalId: string, message: ApiPrivateMessage) => void
}

export const usePrivateChatStore = create<PrivateChatState>((set) => ({
  messages: {},
  setMessages: (professionalId: string, messages: ApiPrivateMessage[]) =>
    set(state => ({
      messages: {
        ...state.messages,
        [professionalId]: messages,
      },
    })),
  addMessage: (professionalId: string, message: ApiPrivateMessage) =>
    set(state => {
      const existing = state.messages[professionalId] ?? []
      // Dedup por id: el emisor recibe su propio mensaje por la respuesta del POST
      // y también por la cola WS; no debe duplicarse.
      if (existing.some(m => m.id === message.id)) return state
      return {
        messages: {
          ...state.messages,
          [professionalId]: [...existing, message],
        },
      }
    }),
}))
