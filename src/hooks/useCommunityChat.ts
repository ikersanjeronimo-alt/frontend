import { useCallback, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useApi } from './useApi'
import { getMessages, sendMessage as apiSendMessage } from '../services/communities'
import { initCommunityChatWS, unsubscribeCommunityChat } from '../services/communityChatWS'
import { useCommunityChatStore } from '../store/communityChatStore'
import type { ApiMessage } from '../types/api'

const EMPTY: ApiMessage[] = []

export function useCommunityChat(communityId: string) {
  const { user } = useAuth()
  const username = user?.username ?? 'Tú'

  const { data: apiMessages, loading, error } = useApi(
    () => getMessages(communityId),
    EMPTY,
    [communityId],
  )

  const messagesByCommunity = useCommunityChatStore(state => state.messages)
  const setWsMessages = useCommunityChatStore(state => state.setMessages)

  const storedMessages = messagesByCommunity[communityId] ?? EMPTY

  useEffect(() => {
    if (!communityId) return
    initCommunityChatWS(communityId)
    return () => {
      unsubscribeCommunityChat(communityId)
    }
  }, [communityId])

  useEffect(() => {
    if (apiMessages.length > 0 && storedMessages.length === 0) {
      setWsMessages(communityId, apiMessages)
    }
  }, [apiMessages, storedMessages.length, communityId, setWsMessages])

  const messages = storedMessages.length > 0 ? storedMessages : apiMessages

  const sendMessage = useCallback(async (text: string) => {
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const optimistic: ApiMessage = {
      id: tempId,
      username,
      text,
      time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      own: true,
    }

    const store = useCommunityChatStore.getState()
    const current = store.messages[communityId] ?? EMPTY
    store.setMessages(communityId, [...current, optimistic])

    try {
      const saved = await apiSendMessage(communityId, text)
      useCommunityChatStore.getState().addMessage(communityId, { ...saved, own: true })
    } catch (error) {
      const latest = useCommunityChatStore.getState().messages[communityId] ?? EMPTY
      useCommunityChatStore.getState().setMessages(
        communityId,
        latest.filter(m => m.id !== tempId),
      )
      throw error
    }
  }, [communityId, username])

  return { messages, loading, error, sendMessage }
}
