import { apiFetch } from './api'
import type { ApiProfile, ApiSettings, ApiModProfile } from '../types/api'

export function getProfile(): Promise<ApiProfile> {
  return apiFetch<ApiProfile>('/api/users/me/profile')
}

export function updateSettings(settings: Partial<ApiSettings>): Promise<void> {
  return apiFetch<void>('/api/users/me/settings', {
    method: 'PATCH',
    body: JSON.stringify(settings),
  })
}

export function saveOnboarding(topics: string[]): Promise<void> {
  return apiFetch<void>('/api/users/me/onboarding', {
    method: 'POST',
    body: JSON.stringify({ topics }),
  })
}

export function getModProfile(): Promise<ApiModProfile> {
  return apiFetch<ApiModProfile>('/api/users/me/mod-profile')
}

export function updateModProfile(data: Partial<ApiModProfile>): Promise<void> {
  return apiFetch<void>('/api/users/me/mod-profile', {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  return apiFetch<void>('/api/users/me/password', {
    method: 'PATCH',
    body: JSON.stringify({ currentPassword, newPassword }),
  })
}

export function submitMood(value: number): Promise<void> {
  return apiFetch<void>('/api/users/me/mood', {
    method: 'POST',
    body: JSON.stringify({ value }),
  })
}
