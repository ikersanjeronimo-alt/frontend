import { apiFetch } from './api'

export function sendLetter(message: string, email: string, deliveryDate: string): Promise<void> {
  return apiFetch<void>('/api/timeMachine', {
    method: 'POST',
    body: JSON.stringify({ message, email , deliveryDate}),
  })
}
