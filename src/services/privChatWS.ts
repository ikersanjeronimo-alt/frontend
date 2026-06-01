import type { Client } from '@stomp/stompjs'
import { getClient, onConnect } from '../lib/wsClient'
import type { ApiPrivateMessage } from '../types/api'
import { usePrivateChatStore } from '../store/privateChatStore'

const subscriptions: Map<string, () => void> = new Map()

export function initPrivateChatWS(professionalId: string): void {
  // Si ya hay suscripción para este chat, no hacer nada
  if (subscriptions.has(professionalId)) {
    return
  }

  const client = getClient()

  // Si el cliente ya está conectado, suscribirse inmediatamente
  if (client?.connected) {
    subscribe(client, professionalId)
  } else {
    // Si no está conectado, hacerlo cuando se conecte
    onConnect((connectedClient: Client) => {
      // Verificar que aún no hay suscripción (podría haberse creado en el intervalo)
      if (!subscriptions.has(professionalId)) {
        subscribe(connectedClient, professionalId)
      }
    })
  }
}

function subscribe(client: Client, professionalId: string): void {
  const topic = `/topic/privateChats/${professionalId}`

  const unsubscribe = client.subscribe(topic, (message) => {
    try {
      const msg: ApiPrivateMessage = JSON.parse(message.body)
      usePrivateChatStore.getState().addMessage(professionalId, msg)
    } catch (err) {
      console.error(`[privateChat/${professionalId}] Error parsing message:`, err)
    }
  }).unsubscribe

  subscriptions.set(professionalId, unsubscribe)
  console.log(`[privateChat] Subscribed to ${topic}`)
}

export function unsubscribePrivateChat(professionalId: string): void {
  const unsubscribe = subscriptions.get(professionalId)
  if (unsubscribe) {
    unsubscribe()
    subscriptions.delete(professionalId)
    console.log(`[privateChat] Unsubscribed from ${professionalId}`)
  }
}
