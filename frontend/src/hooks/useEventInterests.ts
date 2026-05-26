import { useSyncExternalStore, useCallback } from 'react'
import {
  getInterests,
  subscribeInterests,
  isInterested,
  toggleInterest,
} from '../lib/eventInterests'

export function useEventInterests() {
  const interests = useSyncExternalStore(subscribeInterests, getInterests, getInterests)
  const toggle = useCallback((id: string) => toggleInterest(id), [])
  return { interests, isInterested, toggle }
}
