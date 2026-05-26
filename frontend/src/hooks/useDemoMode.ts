import { useSyncExternalStore } from 'react'
import { getDemoMode, subscribeDemoMode } from '../lib/demoMode'

export function useDemoMode(): boolean {
  return useSyncExternalStore(subscribeDemoMode, getDemoMode, getDemoMode)
}
