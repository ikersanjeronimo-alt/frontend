import { useApi } from './useApi'
import { getFloatingBottles } from '../services/bottles'
import { MOCK_BOTTLE_STORIES } from '../mocks/data'

export function useFloatingBottles() {
  return useApi(getFloatingBottles, MOCK_BOTTLE_STORIES)
}
