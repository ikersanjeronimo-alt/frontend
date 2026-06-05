import type { Client } from '@stomp/stompjs'
import { getClient, onConnect } from '../lib/wsClient'
import type { ApiMessage } from '../types/api'
import { useCommunityChatStore } from '../store/communityChatStore'
import { useCommunitiesStore } from '../store/communitiesStore'

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

  const unsubscribeMessages = client.subscribe(topic, (message) => {
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

  // Presencia real: el backend deriva el numero de usuarios en linea de las
  // sesiones STOMP vivas suscritas a esta comunidad y lo publica aqui cada vez
  // que alguien entra o sale (incluido cierre brusco). Ya no hay contador +1/-1.
  const unsubscribePresence = client.subscribe(`${topic}/presence`, (message) => {
    try {
      const payload: { communityId: string; online: number } = JSON.parse(message.body)
      useCommunitiesStore.getState().setCommunities(prev =>
        prev.map(c => c.id === String(payload.communityId)
          ? { ...c, online: payload.online }
          : c))
    } catch (err) {
      console.error(`[communityChat/${communityId}] Error parsing presence:`, err)
    }
  }).unsubscribe

  subscriptions.set(communityId, () => {
    unsubscribeMessages()
    unsubscribePresence()
  })
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
