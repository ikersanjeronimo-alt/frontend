import { create } from 'zustand'

export interface Story {
  id:   string
  lat:  number
  lng:  number
  text: string
}

interface StoriesState {
  stories:      Story[]
  connected:    boolean
  setStories:   (stories: Story[]) => void
  addStory:     (story: Story) => void
  setConnected: (v: boolean) => void
}

export const useStoriesStore = create<StoriesState>((set) => ({
  stories:      [],
  connected:    false,
  setStories:   (stories) => set({ stories }),
  addStory:     (story)   => set(state => ({
    stories: state.stories.some(s => s.id === story.id)
      ? state.stories
      : [...state.stories, story]
  })),
  setConnected: (connected) => set({ connected }),
}))