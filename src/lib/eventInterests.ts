/**
 * "Me interesa" en eventos: set de IDs persistido en localStorage.
 * Cuando exista el back, sincronizar con POST/DELETE /api/events/:id/interest
 * y reemplazar el count optimista por el del servidor.
 */
import { eventInterestsStorage } from '../services/storage'

type Listener = (ids: ReadonlySet<string>) => void

const listeners = new Set<Listener>()
let interests: Set<string> = new Set(eventInterestsStorage.get() ?? [])

function persist(): void {
  eventInterestsStorage.set([...interests])
}

function notify(): void {
  listeners.forEach(l => l(interests))
}

export function getInterests(): ReadonlySet<string> {
  return interests
}

export function subscribeInterests(fn: Listener): () => void {
  listeners.add(fn)
  return () => { listeners.delete(fn) }
}

export function isInterested(id: string): boolean {
  return interests.has(id)
}

export function toggleInterest(id: string): boolean {
  const next = new Set(interests)
  const wasInterested = next.has(id)
  if (wasInterested) next.delete(id)
  else                next.add(id)
  interests = next
  persist()
  notify()
  return !wasInterested
}
