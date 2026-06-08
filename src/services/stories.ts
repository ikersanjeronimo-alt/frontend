import { apiFetch } from './api'
import type { ApiStory } from '../types/api'

export function getStories(): Promise<ApiStory[]> {
  return apiFetch<ApiStory[]>('/api/stories')
}

export function createStory(lat: number, lng: number, text: string): Promise<ApiStory> {
  return apiFetch<ApiStory>('/api/stories', {
    method: 'POST',
    body: JSON.stringify({ text, lat, lng }),
  })
}

/** Borra una historia del mapa (solo moderadores/administradores). */
export function deleteStory(id: string): Promise<void> {
  return apiFetch<void>(`/api/stories/${id}`, { method: 'DELETE' })
}
