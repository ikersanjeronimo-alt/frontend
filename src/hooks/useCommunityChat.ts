import { useCallback, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { useApi } from './useApi'
import { optimisticMutation } from '../lib/optimisticMutation'
import { getMessages, sendMessage as apiSendMessage } from '../services/communities'
import { MOCK_MESSAGES } from '../mocks/data'
import type { ApiMessage } from '../types/api'

export function useCommunityChat(communityId: string) {
  const { user } = useAuth()
  const username = user?.username ?? 'tú'

  // Atribuimos los mensajes "propios" del mock al usuario actual.
  const fallback = useMemo<ApiMessage[]>(
    () => MOCK_MESSAGES.map(m => (m.own ? { ...m, username } : m)),
    [username],
  )

  const { data: messages, setData: setMessages, loading, error } = useApi(
    () => getMessages(communityId),
    fallback,
    [communityId, fallback],
  )

  const sendMessage = useCallback(async (text: string) => {
    const tempId = `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
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
