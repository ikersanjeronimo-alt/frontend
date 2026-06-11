import { apiFetch } from './api'
import type { ApiEvent, ApiEventForm } from '../types/api'

export function getEvents(): Promise<ApiEvent[]> {
  return apiFetch<ApiEvent[]>('/api/events')
}

export interface CreateEventPayload {
  title: string
  description: string
  date: string
  topic?: string
  place?: string
}

export function createEvent(payload: CreateEventPayload): Promise<ApiEvent> {
  return apiFetch<ApiEvent>('/api/events', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function getEventById(id: string): Promise<ApiEvent> {
  return apiFetch<ApiEvent>(`/api/events/${id}`)
}

export function markInterest(id: string, on: boolean): Promise<ApiEvent> {
  return apiFetch<ApiEvent>(`/api/events/${id}/interest`, {
    method: on ? 'POST' : 'DELETE',
  })
}

// ── Cuestionario de evento ───────────────────────────────────────────────────

export interface CreateEventFormPayload {
  kind: 'choice' | 'text'
  question: string
  /** Solo para `choice`. */
  options?: string[]
}

/** Devuelve el cuestionario del evento, o `undefined` si no hay (backend → 204). */
export function getEventForm(eventId: string): Promise<ApiEventForm | undefined> {
  return apiFetch<ApiEventForm | undefined>(`/api/events/${eventId}/form`)
}

export function createEventForm(eventId: string, payload: CreateEventFormPayload): Promise<ApiEventForm> {
  return apiFetch<ApiEventForm>(`/api/events/${eventId}/form`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function deleteEventForm(eventId: string): Promise<void> {
  return apiFetch<void>(`/api/events/${eventId}/form`, { method: 'DELETE' })
}

export function voteEventForm(eventId: string, optionIndex: number): Promise<ApiEventForm> {
  return apiFetch<ApiEventForm>(`/api/events/${eventId}/form/vote`, {
    method: 'POST',
    body: JSON.stringify({ optionIndex }),
  })
}

export function respondEventForm(eventId: string, text: string): Promise<ApiEventForm> {
  return apiFetch<ApiEventForm>(`/api/events/${eventId}/form/response`, {
    method: 'POST',
    body: JSON.stringify({ text }),
  })
}
