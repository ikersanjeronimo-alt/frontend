import { useCallback, useEffect } from 'react'
import { useApi } from './useApi'
import { getPrivateChat, sendPrivateMessage } from '../services/chats'
import { initPrivateChatWS } from '../services/privChatWS'
import { usePrivateChatStore } from '../store/privateChatStore'
import type { ApiPrivateMessage } from '../types/api'

const EMPTY: ApiPrivateMessage[] = []

export function usePrivateChat(professionalId: string) {
  const { data: apiMessages, loading, error } = useApi(
    () => (professionalId ? getPrivateChat(professionalId) : Promise.resolve(EMPTY)),
    EMPTY,
    [professionalId],
  )

  const wsMessages = usePrivateChatStore(state => state.messages[professionalId] ?? EMPTY)
  const setWsMessages = usePrivateChatStore(state => state.setMessages)

  useEffect(() => {
    if (!professionalId) return
    // Suscripción global a la cola personal (idempotente); no se desuscribe por
    // conversación porque la cola es del usuario, no de un hilo concreto.
    initPrivateChatWS()

    const current = usePrivateChatStore.getState().messages[professionalId] ?? EMPTY
    if (current.length === 0 && apiMessages.length > 0) {
      setWsMessages(professionalId, apiMessages)
    }
  }, [professionalId, apiMessages, setWsMessages])

  const messages = wsMessages.length > 0 ? wsMessages : apiMessages

  const sendMessage = useCallback(async (text: string) => {
    if (!professionalId) return
    const tempId = `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const optimistic: ApiPrivateMessage = {
      id: tempId,
      from: 'user',
      text,
      time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
    }

    const store = usePrivateChatStore.getState()
    const current = store.messages[professionalId] ?? EMPTY
    store.setMessages(professionalId, [...current, optimistic])

    try {
      const saved = await sendPrivateMessage(professionalId, text)
      // Quitar el optimista y cualquier eco del WS que ya haya llegado con el id
      // real, y dejar una sola copia de `saved` (evita la burbuja duplicada).
      const latest = usePrivateChatStore.getState().messages[professionalId] ?? EMPTY
      const deduped = latest.filter(message => message.id !== tempId && message.id !== saved.id)
      usePrivateChatStore.getState().setMessages(professionalId, [...deduped, saved])
      return saved
    } catch (error) {
      const latest = usePrivateChatStore.getState().messages[professionalId] ?? EMPTY
      usePrivateChatStore.getState().setMessages(
        professionalId,
        latest.filter(message => message.id !== tempId),
      )
      throw error
    }
  }, [professionalId])

  return { messages, loading, error, sendMessage }
}
