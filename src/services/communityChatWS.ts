import type { Client } from '@stomp/stompjs'
import { getClient, onConnect } from '../lib/wsClient'
import type { ApiMessage } from '../types/api'
import { useCommunityChatStore } from '../store/communityChatStore'
import { updateCommunityOnline } from './communities'

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
      const payload: ApiMessage = JSON.parse(message.body)
      if (payload.action === 'DELETE') {
        useCommunityChatStore.getState().removeMessage(communityId, payload.id)
      } else {
        useCommunityChatStore.getState().addMessage(communityId, payload)
      }
    } catch (err) {
      console.error(`[communityChat/${communityId}] Error parsing message:`, err)
    }
  }).unsubscribe

  subscriptions.set(communityId, unsubscribe)
  console.log(`[communityChat] Subscribed to ${topic}`)
  void updateCommunityOnline(communityId, 1).catch(err => {
    console.error(`[communityChat/${communityId}] Error updating online +1:`, err)
  })
}

export function unsubscribeCommunityChat(communityId: string): void {
  const unsubscribe = subscriptions.get(communityId)
  if (unsubscribe) {
    unsubscribe()
    subscriptions.delete(communityId)
    console.log(`[communityChat] Unsubscribed from ${communityId}`)
    void updateCommunityOnline(communityId, -1).catch(err => {
      console.error(`[communityChat/${communityId}] Error updating online -1:`, err)
    })
  }
}
