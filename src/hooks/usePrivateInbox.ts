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

  const [messagesError, setMessagesError] = useState<string | null>(null)
  // userIds cuya carga REST ya terminó (éxito o error) — permite derivar el loading
  // sin setear estado de forma síncrona dentro del effect.
  const [fetchedUserIds, setFetchedUserIds] = useState<ReadonlySet<string>>(() => new Set())

  // ── Tienda WS ──────────────────────────────────────────────────────────────
  const setInboxMessages = usePrivateChatStore(state => state.setInboxMessages)
  const inboxLastMessages = usePrivateChatStore(state => state.inboxLastMessages)

  // ── Iniciar suscripción WebSocket ──────────────────────────────────────────
  useEffect(() => {
    if (enabled) initPrivateChatWS()
  }, [enabled])

  // ── Lista derivada: API + último mensaje del WS (incluye el optimista) ──────
  // El sidebar se actualiza solo porque el envío optimista usa addInboxMessage,
  // que escribe en inboxLastMessages.
  const conversations = useMemo(
    () => apiConversations.map(conv => {
      const latest = inboxLastMessages[conv.userId]
      return latest ? { ...conv, lastMessage: latest.text, lastTime: latest.time } : conv
    }),
    [apiConversations, inboxLastMessages],
  )

  // ── Usuario seleccionado ───────────────────────────────────────────────────
  const selectedUserId = useMemo(() => {
    if (selectedUserIdFromRoute) return selectedUserIdFromRoute
    return conversations[0]?.userId ?? ''
  }, [conversations, selectedUserIdFromRoute])

  // ── Cargar mensajes REST para la conversación seleccionada (si store vacío) ─
  useEffect(() => {
    if (!enabled || !selectedUserId) return
    if (fetchedUserIds.has(selectedUserId)) return
    // Si el store ya tiene mensajes, el WebSocket se encarga; no volvemos a cargar
    if ((usePrivateChatStore.getState().inboxMessages[selectedUserId] ?? EMPTY_MESSAGES).length > 0) return

    let cancelled = false
    getProfessionalInboxMessages(selectedUserId)
      .then(msgs => { if (!cancelled) { setInboxMessages(selectedUserId, msgs); setMessagesError(null) } })
      .catch(err => { if (!cancelled) setMessagesError(err instanceof Error ? err.message : 'Error.') })
      .finally(() => { if (!cancelled) setFetchedUserIds(prev => new Set(prev).add(selectedUserId)) })

    return () => { cancelled = true }
  }, [selectedUserId, enabled, setInboxMessages, fetchedUserIds])

  // ── Mensajes del hilo actual (directos del store WS) ──────────────────────
  const messages = usePrivateChatStore(
    state => state.inboxMessages[selectedUserId] ?? EMPTY_MESSAGES,
  )

  // Estamos cargando si hay un usuario seleccionado cuya carga aún no terminó
  // y el store sigue sin mensajes para él.
  const loadingMessages = enabled
    && !!selectedUserId
    && !fetchedUserIds.has(selectedUserId)
    && messages.length === 0
    && !messagesError

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

    // Optimista: addInboxMessage añade al hilo y actualiza inboxLastMessages,
    // así que el sidebar (derivado de inboxLastMessages) se refresca solo.
    usePrivateChatStore.getState().addInboxMessage(selectedUserId, optimistic)

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
