import { themeStorage } from '../services/storage'

export type Theme = 'light' | 'dark'

export function getStoredTheme(): Theme | null {
  return themeStorage.get()
}

export function getSystemTheme(): Theme {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function getInitialTheme(): Theme {
  return getStoredTheme() ?? getSystemTheme()
}

export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme)
}

export function setTheme(theme: Theme): void {
  themeStorage.set(theme)
  applyTheme(theme)
}
