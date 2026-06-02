import { create } from 'zustand'

export interface Event {
  id:               string
  title:            string
  date:             string
  host?:            string
  time?:            string
  duration?:        string
  place?:           string
  spots?:           number
  total?:           number
  tags?:            string[]
  desc?:            string
  joined?:          boolean
  interestedCount?: number
  interested?:      boolean
}

interface EventState {
  events:      Event[]
  connected:    boolean
  setEvents:   (events: Event[]) => void
  addEvent:     (event: Event) => void
  removeEvent:  (id: string) => void
  updateEvent:  (event: Event) => void
  setConnected: (v: boolean) => void
}

export const useEventStore = create<EventState>((set) => ({
    events: [],
    connected: false,
    setEvents:  (events) => set({ events }),
    addEvent:     (event)   => set(state => ({
        events: state.events.some(s => s.id === event.id)
        ? state.events.map(existing => existing.id === event.id
            ? { ...existing, ...event, interested: event.interested ?? existing.interested }
            : existing)
        : [...state.events, event]
    })),
    removeEvent:  (id)      => set(state => ({
    events: state.events.filter(e => e.id !== id)
    })),
    updateEvent:  (event)   => set(state => ({
        events: state.events.map(e => e.id === event.id
          ? { ...e, ...event, interested: event.interested ?? e.interested }
          : e)
    })),
    setConnected: (connected) => set({ connected }),
}))
