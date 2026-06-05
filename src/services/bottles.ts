import { apiFetch } from './api'
import type { ApiBottle, ApiBottleStory } from '../types/api'

export function sendBottle(message: string): Promise<void> {
  return apiFetch<void>('/api/bottles', {
    method: 'POST',
    body: JSON.stringify({ message }),
  })
}

export function receiveBottle(): Promise<ApiBottle> {
  return apiFetch<ApiBottle>('/api/bottles/received')
}

export function getFloatingBottles(): Promise<ApiBottleStory[]> {
  return apiFetch<ApiBottleStory[]>('/api/bottles/floating')
}
