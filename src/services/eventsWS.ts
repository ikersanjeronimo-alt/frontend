import type { Client, StompSubscription } from '@stomp/stompjs'
import { onConnect, onDisconnect, offConnect, getClient } from '../lib/wsClient'
import { getEvents } from './events'
import { useEventStore, type Event } from '../store/eventsStore'
import type { ApiEventForm } from '../types/api'

const TOPIC = '/topic/events'

/**
 * Suscribe a las actualizaciones en vivo del cuestionario de un evento
 * (`/topic/events/{id}/form`). El handler recibe la vista PUBLICA del formulario
 * (sin datos por-usuario) o `null` si se borro. Devuelve una funcion para
 * desuscribirse; es segura ante (re)conexiones y no deja callbacks colgando.
 */
export function subscribeEventForm(
  eventId: string,
  handler: (form: ApiEventForm | null) => void,
): () => void {
  const topic = `/topic/events/${eventId}/form`
  let sub: StompSubscription | null = null

  const doSubscribe = (client: Client) => {
    sub?.unsubscribe()
    sub = client.subscribe(topic, (message) => {
      try {
        const payload = JSON.parse(message.body) as { form: ApiEventForm | null }
        handler(payload.form ?? null)
      } catch (err) {
        console.error('[eventForm] Error parsing message:', err)
      }
    })
  }

  const client = getClient()
  if (client?.connected) doSubscribe(client)
  // Cubre la primera conexion (si aun no estaba) y las reconexiones posteriores.
  onConnect(doSubscribe)

  return () => {
    offConnect(doSubscribe)
    sub?.unsubscribe()
    sub = null
  }
}

interface EventMessage {
  action: 'CREATE' | 'UPDATE' | 'DELETE'
  event: {
    id: string | number
    title: string
    description?: string
    desc?: string
    date: string
    place?: string
    reaction?: number
    topic?: string
    tags?: string[]
    interestedCount?: number
    interested?: boolean
    [key: string]: unknown
  }
}

export function initEventsWS(): void {
  onConnect((client: Client) => {
    fetchInitialEvents()
    useEventStore.getState().setConnected(true)

    client.subscribe(TOPIC, (message) => {
      try {
        const payload: EventMessage = JSON.parse(message.body)
        handleEventMessage(payload)
      } catch (err) {
        console.error('[events] Error parsing message:', err)
      }
    })
  })

  onDisconnect(() => {
    useEventStore.getState().setConnected(false)
  })
}

function handleEventMessage(payload: EventMessage): void {
  const event: Event = {
    id: String(payload.event.id),
    title: payload.event.title,
    desc: payload.event.description ?? payload.event.desc ?? '',
    date: payload.event.date,
    host: payload.event.topic ?? undefined,
    duration: payload.event.place ?? undefined,
    interestedCount: payload.event.reaction ?? payload.event.interestedCount ?? 0,
    tags: payload.event.tags ?? [],
  }

  switch (payload.action) {
    case 'CREATE':
      useEventStore.getState().addEvent(event)
      break
    case 'UPDATE':
      useEventStore.getState().updateEvent(event)
      break
    case 'DELETE':
      useEventStore.getState().removeEvent(event.id)
      break
    default:
      console.warn('[events] Unknown action:', payload.action)
  }
}

async function fetchInitialEvents() {
  try {
    const res = await getEvents()
    const data: Event[] = res.map(s => ({
      id: String(s.id),
      title: s.title,
      desc: s.desc ?? s.description ?? '',
      date: s.date,
      host: s.topic ?? undefined,
      duration: s.place ?? undefined,
      interestedCount: s.reaction ?? s.interestedCount ?? 0,
      interested: s.interested ?? undefined,
      tags: s.tags ?? [],
    }))
    useEventStore.getState().setEvents(data)
  } catch (error) {
    console.error('[events] Error fetching initial events:', error)
  }
}
