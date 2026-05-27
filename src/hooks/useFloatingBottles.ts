import { useApi } from './useApi'
import { getFloatingBottles } from '../services/bottles'
import type { ApiBottleStory } from '../types/api'

const EMPTY: ApiBottleStory[] = []

export function useFloatingBottles() {
  return useApi(getFloatingBottles, EMPTY)
}
