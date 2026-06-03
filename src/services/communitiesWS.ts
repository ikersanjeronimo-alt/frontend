import type { Client } from '@stomp/stompjs'
import { onConnect, onDisconnect } from '../lib/wsClient'
import { useCommunitiesStore } from '../store/communitiesStore'
import { getCommunities } from '../services/communities'
import { restoreAuthFromToken } from './auth'
import { tokenStorage } from './storage'
import type { ApiCommunity } from '../types/api'

const TOPIC = '/topic/communities'

interface CommunityMessage {
  action: 'CREATE' | 'UPDATE' | 'DELETE'
  community: any
}

export function initCommunitiesWS(): void {
  console.log('[communitiesWS] Inicializando...')
  onConnect((client: Client) => {
    console.log('[communitiesWS] Conectado, iniciando...')
    fetchInitialCommunities()
    useCommunitiesStore.getState().setConnected(true)

    client.subscribe(TOPIC, (message) => {
      try {
        const payload: CommunityMessage = JSON.parse(message.body)
        handleCommunityMessage(payload)
      } catch (err) {
        console.error('[communities] Error parsing message:', err)
      }
    })
    console.log('[communitiesWS] Suscrito a', TOPIC)
  })

  onDisconnect(() => {
    console.log('[communitiesWS] Desconectado')
    useCommunitiesStore.getState().setConnected(false)
  })
}

function handleCommunityMessage(payload: CommunityMessage): void {
  const store = useCommunitiesStore.getState()
  const community = normalizeCommunity(payload.community, getCurrentUserId())

  switch (payload.action) {
    case 'CREATE':
      store.addCommunity(community)
      console.log('[communities] Community created:', community.id)
      break
    case 'UPDATE':
      {
        const current = store.communities.find(c => c.id === community.id)
        store.updateCommunity(current ? { ...community, joined: current.joined } : community)
      }
      console.log('[communities] Community updated:', community.id)
      break
    case 'DELETE':
      store.removeCommunity(community.id)
      console.log('[communities] Community deleted:', community.id)
      break
    default:
      console.warn('[communities] Unknown action:', payload.action)
  }
}

async function fetchInitialCommunities() {
  try {
    console.log('[communitiesWS] Cargando comunidades iniciales...')
    const res = await getCommunities()
    console.log('[communitiesWS] Comunidades cargadas:', res.length, res)

    useCommunitiesStore.getState().setCommunities(res)
    console.log('[communitiesWS] Store actualizado')
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      console.warn('[communitiesWS] Timeout loading initial communities')
    } else {
      console.error('[communitiesWS] Error loading initial communities:', err)
    }
  }
}

function normalizeCommunity(raw: any, currentUserId: string | null = null): ApiCommunity {
  return normalizeCommunityWithUser(raw, currentUserId)
}

function normalizeCommunityWithUser(raw: any, currentUserId: string | null): ApiCommunity {
  const modUserId = raw.modUserId != null ? String(raw.modUserId) : null
  const joinedFromBackend = Boolean(raw.joined ?? false)
  const joined = joinedFromBackend || (
    currentUserId != null
    && modUserId != null
    && modUserId === currentUserId
  )

  return {
    id: String(raw.id),
    emoji: raw.emoji ?? '🌐',
    name: raw.name ?? 'Sin nombre',
    mod: raw.mod ?? 'Desconocido',
    modUserId,
    desc: raw.desc ?? '',
    members: raw.members ?? 0,
    online: raw.online ?? 0,
    category: raw.category ?? 'GENERAL',
    joined,
    pinnedNote: raw.pinnedNote,
    chatClosed: Boolean(raw.chatClosed ?? false),
  }
}

function getCurrentUserId(): string | null {
  const token = tokenStorage.get()
  if (!token) {
    return null
  }
  return restoreAuthFromToken(token)?.user.id ?? null
}
