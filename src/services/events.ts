import { apiFetch } from './api'
import type { ApiEvent } from '../types/api'

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

export function joinEvent(id: string): Promise<void> {
  return apiFetch<void>(`/api/events/${id}/join`, { method: 'POST' })
}

export function leaveEvent(id: string): Promise<void> {
  return apiFetch<void>(`/api/events/${id}/join`, { method: 'DELETE' })
}

export function markInterest(id: string, on: boolean): Promise<ApiEvent> {
  return apiFetch<ApiEvent>(`/api/events/${id}/interest`, {
    method: on ? 'POST' : 'DELETE',
  })
}
