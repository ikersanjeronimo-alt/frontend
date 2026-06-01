import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { useStoriesStore } from '../store/storiesStore'
import type { Story } from '../store/storiesStore'

const WS_URL      = import.meta.env.VITE_WS_URL      ?? 'http://localhost:8080/ws'
const STORIES_API = import.meta.env.VITE_API_URL     ?? 'http://localhost:8080/api'
const TOPIC       = '/topic/storyMap'   // ← ajusta al canal que ya tienes en Spring

let client: Client | null = null

async function fetchInitialStories(): Promise<void> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const res = await fetch(`${STORIES_API}/stories`, { signal: controller.signal })
    clearTimeout(timeoutId)

    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const raw: any[] = await res.json()
    const data: Story[] = raw.map(s => ({
      id:   String(s.id),
      lat:  s.latitude,
      lng:  s.longitude,
      text: s.message,
    }))
    useStoriesStore.getState().setStories(data)
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      console.warn('[stories] Timeout cargando stories iniciales')
    } else {
      console.error('[stories] Error cargando stories iniciales:', err)
    }
  }
}

export function initStories(): void {
  // Evita doble init en StrictMode / HMR
  if (client) return

  client = new Client({
    webSocketFactory: () => new SockJS(WS_URL),

    onConnect: async () => {
      useStoriesStore.getState().setConnected(true)
      console.log('[ws] Conectado')

      // 1. Fetch inicial de la lista existente
      fetchInitialStories()

      // 2. Suscripción al canal de broadcast
      client!.subscribe(TOPIC, (message) => {
        try {
          const raw = JSON.parse(message.body)
          const story: Story = {
            id:   String(raw.id),
            lat:  raw.latitude,
            lng:  raw.longitude,
            text: raw.message,
          }
          useStoriesStore.getState().addStory(story)
        } catch (err) {
          console.error('[ws] Mensaje malformado:', err)
        }
      })
    },

    onDisconnect: () => {
      useStoriesStore.getState().setConnected(false)
      console.log('[ws] Desconectado')
    },

    onStompError: (frame) => {
      console.error('[ws] STOMP error:', frame.headers['message'])
    },

    reconnectDelay: 5000,   // reconexión automática cada 5s si cae
  })

  client.activate()
}

export function disconnectStories(): void {
  client?.deactivate()
  client = null
}