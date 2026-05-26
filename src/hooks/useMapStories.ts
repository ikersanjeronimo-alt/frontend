import { useApi } from './useApi'
import { getStories } from '../services/stories'
import type { ApiStory } from '../types/api'

const EMPTY: ApiStory[] = []

export function useMapStories() {
  return useApi(
    getStories,
    EMPTY,
    () => import('../mocks/data').then(m => m.MOCK_STORIES),
  )
}
