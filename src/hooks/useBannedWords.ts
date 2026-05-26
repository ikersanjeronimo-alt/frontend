import { useSyncExternalStore } from 'react'
import {
  getBannedWords,
  subscribeBannedWords,
  addBannedWord,
  removeBannedWord,
  updateBannedWord,
} from '../lib/bannedWords'

export function useBannedWords() {
  const words = useSyncExternalStore(subscribeBannedWords, getBannedWords, getBannedWords)
  return {
    words,
    add:    addBannedWord,
    remove: removeBannedWord,
    update: updateBannedWord,
  }
}
