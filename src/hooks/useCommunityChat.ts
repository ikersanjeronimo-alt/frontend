import { useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { useApi } from './useApi'
import { optimisticMutation } from '../lib/optimisticMutation'
import { getMessages, sendMessage as apiSendMessage } from '../services/communities'
import type { ApiMessage } from '../types/api'

const EMPTY: ApiMessage[] = []

export function useCommunityChat(communityId: string) {
  const { user } = useAuth()
  const username = user?.username ?? 'tú'

  const { data: messages, setData: setMessages, loading, error } = useApi(
    () => getMessages(communityId),
    EMPTY,
    [communityId],
  )

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
        setData:    setMessages,
        optimistic: prev => [...prev, optimistic],
        call:       () => apiSendMessage(communityId, text),
        onSuccess:  (prev, saved) => prev.map(m => m.id === tempId ? saved : m),
        rollback:   prev => prev.filter(m => m.id !== tempId),
      })
    } catch { /* el helper ya ha hecho rollback; el UI puede mostrar feedback aparte si quiere */ }
  }, [communityId, username, setMessages])

  return { messages, setMessages, loading, error, sendMessage }
}
