import type { Client } from '@stomp/stompjs'
import { onConnect, onDisconnect } from '../lib/wsClient'
import { getEvents } from './events'
import { useEventStore, type Event } from '../store/eventsStore'

const TOPIC = '/topic/events'

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
        place: payload.event.place ?? '',
        interestedCount: payload.event.reaction ?? payload.event.interestedCount ?? 0,
        tags: payload.event.tags ?? (payload.event.topic ? [payload.event.topic] : []),
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
            place: s.place ?? '',
            interestedCount: s.reaction ?? s.interestedCount ?? 0,
            interested: s.interested ?? undefined,
            tags: s.tags ?? (s.topic ? [s.topic] : []),
        }))
        
        useEventStore.getState().setEvents(data) 
    } catch (error) {
        console.error('[events] Error fetching initial events:', error)
    }
}
