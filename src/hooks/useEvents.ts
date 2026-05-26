import { useApi } from './useApi'
import { getEvents } from '../services/events'
import type { ApiEvent } from '../types/api'

const EMPTY: ApiEvent[] = []

export function useEvents() {
  return useApi(
    getEvents,
    EMPTY,
    () => import('../mocks/data').then(m => m.MOCK_EVENTS),
  )
}
