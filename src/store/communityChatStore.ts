import { create } from 'zustand'
import type { ApiMessage } from '../types/api'

interface CommunityChatState {
  messages: Record<string, ApiMessage[]>
  setMessages: (communityId: string, messages: ApiMessage[]) => void
  addMessage: (communityId: string, message: ApiMessage) => void
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
        [communityId]: state.messages[communityId]
          ? [...state.messages[communityId], message]
          : [message],
      },
    })),
}))
