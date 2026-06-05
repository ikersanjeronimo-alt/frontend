import type { Client } from '@stomp/stompjs'
import { getClient, onConnect } from '../lib/wsClient'
import type { ApiMessage } from '../types/api'
import { useCommunityChatStore } from '../store/communityChatStore'
import { useCommunitiesStore } from '../store/communitiesStore'

const subscriptions: Map<string, () => void> = new Map()

export function initCommunityChatWS(communityId: string): void {
  if (subscriptions.has(communityId)) return

  const client = getClient()

  if (client?.connected) {
    subscribe(client, communityId)
  } else {
    onConnect((connectedClient: Client) => {
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

  // Presencia real: el backend deriva el número de usuarios en línea de las
  // sesiones STOMP vivas suscritas a esta comunidad y lo publica aquí cada vez
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
}

export function unsubscribeCommunityChat(communityId: string): void {
  const unsubscribe = subscriptions.get(communityId)
  if (unsubscribe) {
    unsubscribe()
    subscriptions.delete(communityId)
  }
}
