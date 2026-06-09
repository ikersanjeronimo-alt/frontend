import type { Client } from '@stomp/stompjs'
import { getClient, onConnect, onDisconnect } from '../lib/wsClient'
import { useNotificationsStore } from '../store/notificationsStore'

/**
 * Suscripción a la cola personal de notificaciones del usuario
 * (`/user/queue/notifications`). Spring entrega aquí avisos dirigidos solo al
 * Principal autenticado (p. ej. un aviso de moderación). Es "en vivo": solo
 * llega si el usuario está conectado en ese momento.
 *
 * Mismo patrón que privChatWS: `subscribed` se resetea en cada desconexión para
 * re-suscribirse al reconectar; `registered` evita apilar callbacks.
 */
let subscribed = false
let registered = false

export function initNotificationsWS(): void {
  const client = getClient()
  if (client?.connected && !subscribed) subscribe(client)

  if (registered) return
  registered = true

  onConnect((connectedClient: Client) => {
    if (!subscribed) subscribe(connectedClient)
  })
  onDisconnect(() => {
    subscribed = false
  })
}

function subscribe(client: Client): void {
  client.subscribe('/user/queue/notifications', (message) => {
    try {
      const raw = JSON.parse(message.body) as { type?: string; warnings?: number }
      useNotificationsStore.getState().show({
        type:     raw.type ?? 'INFO',
        warnings: raw.warnings,
      })
    } catch (err) {
      console.error('[notifications] Error parsing message:', err)
    }
  })
  subscribed = true
}
