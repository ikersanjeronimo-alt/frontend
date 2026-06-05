import type { Client } from '@stomp/stompjs'
import { getClient, onConnect, onDisconnect } from '../lib/wsClient'
import type { ApiPrivateMessage } from '../types/api'
import { usePrivateChatStore } from '../store/privateChatStore'

/**
 * Suscripción ÚNICA a la cola personal del usuario (/user/queue/private).
 * Spring entrega aquí los mensajes de todas las conversaciones del usuario
 * autenticado; cada mensaje trae userId y professionalId para enrutarlo.
 *
 * - Lado usuario:      la clave de conversación es professionalId → messages
 * - Lado profesional:  la clave de conversación es userId         → inboxMessages
 */
interface IncomingPrivateMessage extends ApiPrivateMessage {
  userId?: string
  professionalId?: string
  action?: 'DELETE'
}

// `subscribed` vale solo para la conexión STOMP viva: se resetea en cada
// desconexión para volver a suscribirse al reconectar. `registered` evita
// apilar callbacks si initPrivateChatWS se llama varias veces.
let subscribed = false
let registered = false

export function initPrivateChatWS(): void {
  const client = getClient()
  if (client?.connected && !subscribed) {
    subscribe(client)
  }

  if (registered) return
  registered = true

  // Re-suscribirse en cada (re)conexión: tras login/logout o un corte de red,
  // syncWSAuth abre una conexión nueva cuyo Principal puede ser distinto, y la
  // cola /user/queue/private hay que volver a suscribirla en esa sesión.
  onConnect((connectedClient: Client) => {
    if (!subscribed) subscribe(connectedClient)
  })
  onDisconnect(() => {
    subscribed = false
  })
}

function subscribe(client: Client): void {
  client.subscribe('/user/queue/private', (message) => {
    try {
      const raw: IncomingPrivateMessage = JSON.parse(message.body)
      const store = usePrivateChatStore.getState()
      const msg: ApiPrivateMessage = { id: raw.id, from: raw.from, text: raw.text, time: raw.time }

      // ── Lado usuario: conversación por professionalId ─────────────────────
      if (raw.professionalId) {
        if (raw.action === 'DELETE') {
          store.removeMessage(raw.professionalId, raw.id)
        } else {
          store.addMessage(raw.professionalId, msg)
        }
      }

      // ── Lado profesional (inbox): conversación por userId ─────────────────
      if (raw.userId) {
        if (raw.action === 'DELETE') {
          store.removeInboxMessage(raw.userId, raw.id)
        } else {
          store.addInboxMessage(raw.userId, msg)
        }
      }
    } catch (err) {
      console.error('[privateChat] Error parsing message:', err)
    }
  })

  subscribed = true
}
