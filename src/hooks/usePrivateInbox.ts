import { useCallback, useEffect, useMemo, useState } from 'react'
import { useApi } from './useApi'
import { getProfessionalInbox, getProfessionalInboxMessages, sendProfessionalInboxMessage } from '../services/chats'
import type { ApiPrivateConversation, ApiPrivateMessage } from '../types/api'

const EMPTY_CONVERSATIONS: ApiPrivateConversation[] = []
const EMPTY_MESSAGES: ApiPrivateMessage[] = []

export function usePrivateInbox(selectedUserIdFromRoute = '', enabled = true) {
  const { data: apiConversations, loading: conversationsLoading, error: conversationsError } = useApi(
    () => (enabled ? getProfessionalInbox() : Promise.resolve(EMPTY_CONVERSATIONS)),
    EMPTY_CONVERSATIONS,
    [enabled],
  )

  const [conversations, setConversations] = useState<ApiPrivateConversation[]>(EMPTY_CONVERSATIONS)
  const [messages, setMessages] = useState<ApiPrivateMessage[]>(EMPTY_MESSAGES)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [messagesError, setMessagesError] = useState<string | null>(null)

  useEffect(() => {
    setConversations(apiConversations)
  }, [apiConversations])

  const selectedUserId = useMemo(() => {
    if (selectedUserIdFromRoute) {
      return selectedUserIdFromRoute
    }
    return conversations[0]?.userId ?? ''
  }, [conversations, selectedUserIdFromRoute])

  useEffect(() => {
    if (!enabled || !selectedUserId) {
      setMessages([])
      return
    }

    let cancelled = false
    setLoadingMessages(true)
    setMessagesError(null)

    getProfessionalInboxMessages(selectedUserId)
      .then(next => {
        if (!cancelled) setMessages(next)
      })
      .catch(err => {
        if (!cancelled) setMessagesError(err instanceof Error ? err.message : 'Error.')
      })
      .finally(() => {
        if (!cancelled) setLoadingMessages(false)
      })

    return () => {
      cancelled = true
    }
  }, [selectedUserId, enabled])

  const selectedConversation = useMemo(
    () => conversations.find(conv => conv.userId === selectedUserId) ?? null,
    [conversations, selectedUserId],
  )

  const sendMessage = useCallback(async (text: string) => {
    if (!selectedUserId) return
    const saved = await sendProfessionalInboxMessage(selectedUserId, text)
    setMessages(current => [...current, saved])
    const now = saved.time
    setConversations(current => {
      const next = current.map(conv =>
        conv.userId === selectedUserId
          ? { ...conv, lastMessage: saved.text, lastTime: now }
          : conv,
      )
      if (!next.some(conv => conv.userId === selectedUserId)) {
        return [{
          userId: selectedUserId,
          username: selectedConversation?.username ?? 'Usuario',
          lastMessage: saved.text,
          lastTime: now,
        }, ...next]
      }
      return next
    })
  }, [selectedUserId, selectedConversation])

  return {
    conversations,
    selectedConversation,
    selectedUserId,
    messages,
    sendMessage,
    loading: conversationsLoading || loadingMessages,
    error: conversationsError ?? messagesError,
  }
}
