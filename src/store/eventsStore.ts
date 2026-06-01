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
        ? state.events
        : [...state.events, event]
    })),
    removeEvent:  (id)      => set(state => ({
    events: state.events.filter(e => e.id !== id)
    })),
    updateEvent:  (event)   => set(state => ({
        events: state.events.map(e => e.id === event.id ? event : e)
    })),
    setConnected: (connected) => set({ connected }),
}))