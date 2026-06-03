import { create } from 'zustand'
import type { ApiCommunity } from '../types/api'

export interface CommunitiesState {
  communities: ApiCommunity[]
  connected: boolean
  setCommunities: (communities: ApiCommunity[] | ((prev: ApiCommunity[]) => ApiCommunity[])) => void
  addCommunity: (community: ApiCommunity) => void
  updateCommunity: (community: ApiCommunity) => void
  removeCommunity: (id: string) => void
  setConnected: (v: boolean) => void
}

export const useCommunitiesStore = create<CommunitiesState>((set) => ({
  communities: [],
  connected: false,
  setCommunities: (communities) =>
    set(state => ({
      communities:
        typeof communities === 'function'
          ? communities(state.communities)
          : communities,
    })),
  addCommunity: (community) =>
    set(state => ({
      communities: state.communities.some(c => c.id === community.id)
        ? state.communities
        : [...state.communities, community],
    })),
  updateCommunity: (community) =>
    set(state => ({
      communities: state.communities.map(c => c.id === community.id ? community : c),
    })),
  removeCommunity: (id) =>
    set(state => ({
      communities: state.communities.filter(c => c.id !== id),
    })),
  setConnected: (connected) => set({ connected }),
}))
