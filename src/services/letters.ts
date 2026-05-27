import { apiFetch } from './api'

export function sendLetter(letter: string, email: string): Promise<void> {
  return apiFetch<void>('/api/letters', {
    method: 'POST',
    body: JSON.stringify({ letter, email }),
  })
}
