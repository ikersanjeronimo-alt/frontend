import { create } from 'zustand'
import type { ApiMessage } from '../types/api'

interface CommunityChatState {
  messages: Record<string, ApiMessage[]>
  setMessages: (communityId: string, messages: ApiMessage[]) => void
  addMessage: (communityId: string, message: ApiMessage) => void
  removeMessage: (communityId: string, messageId: string) => void
}

export const useCommunityChatStore = create<CommunityChatState>((set) => ({
  messages: {},
  setMessages: (communityId: string, messages: ApiMessage[]) =>
    set(state => ({
      messages: {
        ...state.messages,
        [communityId]: messages,
      },
    })),
  addMessage: (communityId: string, message: ApiMessage) =>
    set(state => ({
      messages: {
        ...state.messages,
        [communityId]: (() => {
          const current = state.messages[communityId] ?? []
          const existingIndex = current.findIndex(m => m.id === message.id)
          if (existingIndex >= 0) {
            const next = [...current]
            next[existingIndex] = { ...next[existingIndex], ...message }
            return next
          }
          const tempIndex = current.findIndex(m => m.id.startsWith('temp_') && m.username === message.username && m.text === message.text)
          if (tempIndex >= 0) {
            const next = [...current]
            next[tempIndex] = { ...next[tempIndex], ...message }
            return next
          }
          return [...current, message]
        })(),
      },
    })),
  removeMessage: (communityId: string, messageId: string) =>
    set(state => ({
      messages: {
        ...state.messages,
        [communityId]: (state.messages[communityId] ?? []).filter(message => message.id !== messageId),
      },
    })),
}))
