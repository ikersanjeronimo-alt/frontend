import { useCallback, useEffect, useState } from 'react'
import { useApi } from './useApi'
import { optimisticMutation } from '../lib/optimisticMutation'
import { getPrivateChat, sendPrivateMessage } from '../services/chats'
import { initPrivateChatWS, unsubscribePrivateChat } from '../services/privChatWS'
import { usePrivateChatStore } from '../store/privateChatStore'
import type { ApiPrivateMessage } from '../types/api'

const EMPTY: ApiPrivateMessage[] = []

export function usePrivateChat(professionalId: string) {
  const { data: apiMessages, loading, error } = useApi(
    () => getPrivateChat(professionalId),
    EMPTY,
    [professionalId],
  )

  const wsMessages = usePrivateChatStore(state => state.messages[professionalId] ?? [])
  const setWsMessages = usePrivateChatStore(state => state.setMessages)
  const [messages, setMessages] = useState<ApiPrivateMessage[]>(EMPTY)

  // Inicializar WS y sincronizar mensajes
  useEffect(() => {
    initPrivateChatWS(professionalId)
    // Sincronizar mensajes iniciales del API con el store
    setWsMessages(professionalId, apiMessages)
    setMessages(apiMessages)

    return () => {
      unsubscribePrivateChat(professionalId)
    }
  }, [professionalId, setWsMessages, apiMessages])

  // Usar mensajes del WS si están disponibles, sino usar del API
  useEffect(() => {
    setMessages(wsMessages.length > 0 ? wsMessages : apiMessages)
  }, [wsMessages, apiMessages])

  const sendMessage = useCallback(async (text: string) => {
    const tempId = `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const optimistic: ApiPrivateMessage = {
      id: tempId,
      from: 'user',
      text,
      time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
    }
    try {
      await optimisticMutation<ApiPrivateMessage[], ApiPrivateMessage>({
        setData:    (updater) => {
          const newMessages = typeof updater === 'function' ? updater(messages) : updater
          setWsMessages(professionalId, newMessages)
          setMessages(newMessages)
        },
        optimistic: prev => [...prev, optimistic],
        call:       () => sendPrivateMessage(professionalId, text),
        onSuccess:  (prev, saved) => prev.map(m => m.id === tempId ? saved : m),
        rollback:   prev => prev.filter(m => m.id !== tempId),
      })
    } catch { /* el helper ya hizo rollback */ }
  }, [professionalId, messages, setWsMessages])

  return { messages, loading, error, sendMessage }
}
