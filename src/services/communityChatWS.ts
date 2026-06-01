import type { Client } from '@stomp/stompjs'
import { getClient, onConnect } from '../lib/wsClient'
import type { ApiMessage } from '../types/api'
import { useCommunityChatStore } from '../store/communityChatStore'

const subscriptions: Map<string, () => void> = new Map()

export function initCommunityChatWS(communityId: string): void {
  // Si ya hay suscripción para este chat, no hacer nada
  if (subscriptions.has(communityId)) {
    return
  }

  const client = getClient()

  // Si el cliente ya está conectado, suscribirse inmediatamente
  if (client?.connected) {
    subscribe(client, communityId)
  } else {
    // Si no está conectado, hacerlo cuando se conecte
    onConnect((connectedClient: Client) => {
      // Verificar que aún no hay suscripción (podría haberse creado en el intervalo)
      if (!subscriptions.has(communityId)) {
        subscribe(connectedClient, communityId)
      }
    })
  }
}

function subscribe(client: Client, communityId: string): void {
  const topic = `/topic/communities/${communityId}`

  const unsubscribe = client.subscribe(topic, (message) => {
    try {
      const msg: ApiMessage = JSON.parse(message.body)
      useCommunityChatStore.getState().addMessage(communityId, msg)
    } catch (err) {
      console.error(`[communityChat/${communityId}] Error parsing message:`, err)
    }
  }).unsubscribe

  subscriptions.set(communityId, unsubscribe)
  console.log(`[communityChat] Subscribed to ${topic}`)
}

export function unsubscribeCommunityChat(communityId: string): void {
  const unsubscribe = subscriptions.get(communityId)
  if (unsubscribe) {
    unsubscribe()
    subscriptions.delete(communityId)
    console.log(`[communityChat] Unsubscribed from ${communityId}`)
  }
}
