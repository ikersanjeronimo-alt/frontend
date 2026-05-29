import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './lib/i18n'
import App from './App.tsx'
import { applyTheme, getInitialTheme } from './lib/theme'
import { initStories } from './lib/wsClient'

// Conecta webSocket + carga initial stories UNA sola vez
initStories()
// Aplicar tema antes del primer render para evitar parpadeo.
applyTheme(getInitialTheme())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
