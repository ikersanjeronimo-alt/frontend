import { useShallow } from 'zustand/react/shallow'
import { useCommunitiesStore } from '../store/communitiesStore'

export function useCommunities() {
  const { communities, connected, setCommunities } = useCommunitiesStore(
    useShallow(state => ({
      communities: state.communities,
      connected: state.connected,
      setCommunities: state.setCommunities,
    }))
  )

  return {
    data: communities,
    setData: setCommunities,
    loading: !connected && communities.length === 0,
    error: null,
  }
}
