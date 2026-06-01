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
    set(state => ({
      messages: {
        ...state.messages,
        [professionalId]: state.messages[professionalId]
          ? [...state.messages[professionalId], message]
          : [message],
      },
    })),
}))
