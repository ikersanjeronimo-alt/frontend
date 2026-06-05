import { useCallback } from 'react'
import { useEventStore } from '../store/eventsStore'

function setInterest(id: string, interested: boolean): void {
  useEventStore.setState(state => ({
    events: state.events.map(event => {
      if (event.id !== id) return event
      const currentCount = event.interestedCount ?? 0
      const delta = interested === Boolean(event.interested) ? 0 : (interested ? 1 : -1)
      return {
        ...event,
        interested,
        interestedCount: Math.max(0, currentCount + delta),
      }
    }),
  }))
}

export function useEventInterests() {
  const toggle = useCallback((id: string) => {
    const current = useEventStore.getState().events.find(event => event.id === id)?.interested ?? false
    const next = !current
    setInterest(id, next)
    return next
  }, [])

  const isInterested = useCallback((id: string) => {
    return useEventStore.getState().events.find(event => event.id === id)?.interested ?? false
  }, [])

  return { toggle, isInterested }
}
