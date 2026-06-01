import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useApi } from './useApi'
import { optimisticMutation } from '../lib/optimisticMutation'
import { getMessages, sendMessage as apiSendMessage } from '../services/communities'
import { initCommunityChatWS, unsubscribeCommunityChat } from '../services/communityChatWS'
import { useCommunityChatStore } from '../store/communityChatStore'
import type { ApiMessage } from '../types/api'

const EMPTY: ApiMessage[] = []

export function useCommunityChat(communityId: string) {
  const { user } = useAuth()
  const username = user?.username ?? 'tú'

  const { data: apiMessages, loading, error } = useApi(
    () => getMessages(communityId),
    EMPTY,
    [communityId],
  )

  const wsMessages = useCommunityChatStore(state => state.messages[communityId] ?? [])
  const setWsMessages = useCommunityChatStore(state => state.setMessages)
  const [messages, setMessages] = useState<ApiMessage[]>(EMPTY)

  // Inicializar WS y sincronizar mensajes
  useEffect(() => {
    initCommunityChatWS(communityId)
    // Sincronizar mensajes iniciales del API con el store
    setWsMessages(communityId, apiMessages)
    setMessages(apiMessages)

    return () => {
      unsubscribeCommunityChat(communityId)
    }
  }, [communityId, setWsMessages, apiMessages])

  // Usar mensajes del WS si están disponibles, sino usar del API
  useEffect(() => {
    setMessages(wsMessages.length > 0 ? wsMessages : apiMessages)
  }, [wsMessages, apiMessages])

  const sendMessage = useCallback(async (text: string) => {
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const optimistic: ApiMessage = {
      id: tempId,
      username,
      text,
      time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      own: true,
    }
    try {
      await optimisticMutation<ApiMessage[], ApiMessage>({
        setData:    (updater) => {
          const newMessages = typeof updater === 'function' ? updater(messages) : updater
          setWsMessages(communityId, newMessages)
          setMessages(newMessages)
        },
        optimistic: prev => [...prev, optimistic],
        call:       () => apiSendMessage(communityId, text),
        onSuccess:  (prev, saved) => prev.map(m => m.id === tempId ? saved : m),
        rollback:   prev => prev.filter(m => m.id !== tempId),
      })
    } catch { /* el helper ya ha hecho rollback; el UI puede mostrar feedback aparte si quiere */ }
  }, [communityId, username, messages, setWsMessages])

  return { messages, setMessages, loading, error, sendMessage }
}
