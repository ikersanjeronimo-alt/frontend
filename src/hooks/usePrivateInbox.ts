import { useCallback, useEffect, useMemo, useState } from 'react'
import { useApi } from './useApi'
import { getProfessionalInbox, getProfessionalInboxMessages, sendProfessionalInboxMessage } from '../services/chats'
import { initPrivateChatWS } from '../services/privChatWS'
import { usePrivateChatStore } from '../store/privateChatStore'
import type { ApiPrivateConversation, ApiPrivateMessage } from '../types/api'

const EMPTY_CONVERSATIONS: ApiPrivateConversation[] = []
const EMPTY_MESSAGES: ApiPrivateMessage[] = []

export function usePrivateInbox(selectedUserIdFromRoute = '', enabled = true) {
  // ── Lista de conversaciones (REST, solo necesaria al montar) ───────────────
  const { data: apiConversations, loading: conversationsLoading, error: conversationsError } = useApi(
    () => (enabled ? getProfessionalInbox() : Promise.resolve(EMPTY_CONVERSATIONS)),
    EMPTY_CONVERSATIONS,
    [enabled],
  )

  const [conversations, setConversations] = useState<ApiPrivateConversation[]>(EMPTY_CONVERSATIONS)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [messagesError, setMessagesError] = useState<string | null>(null)

  // ── Tienda WS ──────────────────────────────────────────────────────────────
  const setInboxMessages = usePrivateChatStore(state => state.setInboxMessages)
  const inboxLastMessages = usePrivateChatStore(state => state.inboxLastMessages)

  // ── Iniciar suscripción WebSocket ──────────────────────────────────────────
  useEffect(() => {
    if (enabled) initPrivateChatWS()
  }, [enabled])

  // ── Sincronizar lista de conversaciones desde la API ───────────────────────
  useEffect(() => {
    setConversations(apiConversations)
  }, [apiConversations])

  // ── Actualizar lastMessage/lastTime en el sidebar cuando llega un WS msg ───
  useEffect(() => {
    if (Object.keys(inboxLastMessages).length === 0) return
    setConversations(prev =>
      prev.map(conv => {
        const latest = inboxLastMessages[conv.userId]
        if (!latest) return conv
        return { ...conv, lastMessage: latest.text, lastTime: latest.time }
      }),
    )
  }, [inboxLastMessages])

  // ── Usuario seleccionado ───────────────────────────────────────────────────
  const selectedUserId = useMemo(() => {
    if (selectedUserIdFromRoute) return selectedUserIdFromRoute
    return conversations[0]?.userId ?? ''
  }, [conversations, selectedUserIdFromRoute])

  // ── Cargar mensajes REST para la conversación seleccionada (si store vacío) ─
  useEffect(() => {
    if (!enabled || !selectedUserId) return
    // Si el store ya tiene mensajes, el WebSocket se encarga; no volvemos a cargar
    if ((usePrivateChatStore.getState().inboxMessages[selectedUserId] ?? EMPTY_MESSAGES).length > 0) return

    let cancelled = false
    setLoadingMessages(true)
    setMessagesError(null)

    getProfessionalInboxMessages(selectedUserId)
      .then(msgs => { if (!cancelled) setInboxMessages(selectedUserId, msgs) })
      .catch(err => { if (!cancelled) setMessagesError(err instanceof Error ? err.message : 'Error.') })
      .finally(() => { if (!cancelled) setLoadingMessages(false) })

    return () => { cancelled = true }
  }, [selectedUserId, enabled, setInboxMessages])

  // ── Mensajes del hilo actual (directos del store WS) ──────────────────────
  const messages = usePrivateChatStore(
    state => state.inboxMessages[selectedUserId] ?? EMPTY_MESSAGES,
  )

  const selectedConversation = useMemo(
    () => conversations.find(conv => conv.userId === selectedUserId) ?? null,
    [conversations, selectedUserId],
  )

  // ── Enviar mensaje con optimistic update ──────────────────────────────────
  const sendMessage = useCallback(async (text: string) => {
    if (!selectedUserId) return

    const tempId = `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const now = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    const optimistic: ApiPrivateMessage = { id: tempId, from: 'professional', text, time: now }

    // Añadir optimistamente al store
    const store = usePrivateChatStore.getState()
    store.setInboxMessages(selectedUserId, [...(store.inboxMessages[selectedUserId] ?? EMPTY_MESSAGES), optimistic])

    // Actualizar sidebar optimistamente
    setConversations(prev =>
      prev.map(conv =>
        conv.userId === selectedUserId ? { ...conv, lastMessage: text, lastTime: now } : conv,
      ),
    )

    try {
      const saved = await sendProfessionalInboxMessage(selectedUserId, text)
      // Quitar el optimista y cualquier eco del WS con el id real; dejar una sola
      // copia de `saved` (evita la burbuja duplicada en la misma carrera).
      const latest = usePrivateChatStore.getState().inboxMessages[selectedUserId] ?? EMPTY_MESSAGES
      const deduped = latest.filter(m => m.id !== tempId && m.id !== saved.id)
      usePrivateChatStore.getState().setInboxMessages(selectedUserId, [...deduped, saved])
      return saved
    } catch (error) {
      // Rollback
      const latest = usePrivateChatStore.getState().inboxMessages[selectedUserId] ?? EMPTY_MESSAGES
      usePrivateChatStore.getState().setInboxMessages(
        selectedUserId,
        latest.filter(m => m.id !== tempId),
      )
      throw error
    }
  }, [selectedUserId])

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
