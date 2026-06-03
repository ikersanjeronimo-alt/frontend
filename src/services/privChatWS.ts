import type { Client } from '@stomp/stompjs'
import { getClient, onConnect } from '../lib/wsClient'
import type { ApiPrivateMessage } from '../types/api'
import { usePrivateChatStore } from '../store/privateChatStore'

/**
 * Suscripción ÚNICA a la cola personal del usuario (/user/queue/private). Spring
 * solo entrega aquí los mensajes de las conversaciones del propio usuario, así que
 * ya no se reciben conversaciones ajenas (antes se escuchaba el topic compartido
 * por profesional). Cada mensaje trae los ids de la conversación para enrutarlo.
 */
interface IncomingPrivateMessage extends ApiPrivateMessage {
  userId?: string
  professionalId?: string
}

let subscribed = false

export function initPrivateChatWS(): void {
  if (subscribed) return

  const client = getClient()
  if (client?.connected) {
    subscribe(client)
  } else {
    onConnect((connectedClient: Client) => {
      if (!subscribed) subscribe(connectedClient)
    })
  }
}

function subscribe(client: Client): void {
  client.subscribe('/user/queue/private', (message) => {
    try {
      const raw: IncomingPrivateMessage = JSON.parse(message.body)
      // Para el usuario, la conversación se identifica por el profesional
      // (que es la clave del store). El profesional usa la bandeja (no el store).
      const conversationId = raw.professionalId
      if (!conversationId) return

      const msg: ApiPrivateMessage = {
        id: raw.id,
        from: raw.from,
        text: raw.text,
        time: raw.time,
      }
      usePrivateChatStore.getState().addMessage(conversationId, msg)
    } catch (err) {
      console.error('[privateChat] Error parsing message:', err)
    }
  })

  subscribed = true
  console.log('[privateChat] Subscribed to /user/queue/private')
}
