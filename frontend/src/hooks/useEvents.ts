import { useApi } from './useApi'
import { getEvents } from '../services/events'
import { MOCK_EVENTS } from '../mocks/data'

export function useEvents() {
  return useApi(getEvents, MOCK_EVENTS)
}
