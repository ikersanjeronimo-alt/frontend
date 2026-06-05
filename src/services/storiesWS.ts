// storiesWS.ts
import type { Client } from '@stomp/stompjs'
import { onConnect, onDisconnect } from '../lib/wsClient'
import { useStoriesStore, type Story } from '../store/storiesStore'
import { getStories } from './stories'
const TOPIC = '/topic/storyMap'

export function initStoriesWS(): void {
    onConnect((client: Client) => {
        fetchInitialStories()
        useStoriesStore.getState().setConnected(true)
        client.subscribe(TOPIC, res => {
              const raw = JSON.parse(res.body)

              // Evento de borrado (p. ej. historia eliminada por moderación):
              // quita el punto del mapa al instante.
              if (raw.action === 'DELETE') {
                useStoriesStore.getState().removeStory(String(raw.id))
                return
              }

              // CREATE (o mensajes sin acción, por compatibilidad): añade el punto.
              const story: Story = {
                id: String(raw.id),
                lat: raw.latitude,
                lng: raw.longitude,
                text: raw.message
              }

              useStoriesStore.getState().addStory(story)
        })
    })

    onDisconnect(() => {
      useStoriesStore.getState().setConnected(false)
    
  })
}

async function fetchInitialStories() {
    try {

    const res = await getStories()

    console.log(res)

    const data: Story[] = res.map(s => ({
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
