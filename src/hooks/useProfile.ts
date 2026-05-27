import { useApi } from './useApi'
import { getProfile } from '../services/profile'
import type { ApiProfile } from '../types/api'

const EMPTY_PROFILE: ApiProfile = {
  username: '',
  role: 'ANON',
  joinedAt: new Date().toISOString().slice(0, 10),
  stats: { messages: 0, communities: 0, events: 0, stories: 0, bottles: 0 },
  activity: [],
  topics: [],
}

export function useProfile() {
  return useApi(getProfile, EMPTY_PROFILE)
}
