/**
 * "Me interesa" en eventos: set de IDs persistido en localStorage.
 * Cuando exista el back, sincronizar con POST/DELETE /api/events/:id/interest
 * y reemplazar el count optimista por el del servidor.
 */
const STORAGE_KEY = 'sys_event_interests'

type Listener = (ids: ReadonlySet<string>) => void

const listeners = new Set<Listener>()
let interests: Set<string> = loadFromStorage()

function loadFromStorage(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.every(x => typeof x === 'string')) {
      return new Set(parsed)
    }
  } catch { /* JSON inválido */ }
  return new Set()
}

function persist(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...interests]))
  } catch { /* quota / modo privado */ }
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
