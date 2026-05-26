import { useApi } from './useApi'
import { getStories } from '../services/stories'
import { MOCK_STORIES } from '../mocks/data'

export function useMapStories() {
  return useApi(getStories, MOCK_STORIES)
}
