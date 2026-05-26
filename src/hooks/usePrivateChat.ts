import { useCallback } from 'react'
import { useApi } from './useApi'
import { optimisticMutation } from '../lib/optimisticMutation'
import { getPrivateChat, sendPrivateMessage } from '../services/chats'
import type { ApiPrivateMessage } from '../types/api'

const EMPTY: ApiPrivateMessage[] = []

export function usePrivateChat(professionalId: string) {
  const { data: messages, setData: setMessages, loading, error } = useApi(
    () => getPrivateChat(professionalId),
    EMPTY,
    () => import('../mocks/data').then(m => m.buildMockPrivateMessages(professionalId)),
    [professionalId],
  )

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
        setData:    setMessages,
        optimistic: prev => [...prev, optimistic],
        call:       () => sendPrivateMessage(professionalId, text),
        onSuccess:  (prev, saved) => prev.map(m => m.id === tempId ? saved : m),
        rollback:   prev => prev.filter(m => m.id !== tempId),
      })
    } catch { /* el helper ya hizo rollback */ }
  }, [professionalId, setMessages])

  return { messages, loading, error, sendMessage }
}
