import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './lib/i18n'
import App from './App.tsx'
import { applyTheme, getInitialTheme } from './lib/theme'
import { initWS } from './lib/wsClient'
import { initStoriesWS } from './services/storiesWS.ts'
import { initEventsWS } from './services/eventsWS.ts'
import { initCommunitiesWS } from './services/communitiesWS.ts'
import { initPrivateChatWS } from './services/privChatWS.ts'

initWS()
initStoriesWS()
initEventsWS()
initCommunitiesWS()
initPrivateChatWS()

// Aplicar tema antes del primer render para evitar parpadeo.
applyTheme(getInitialTheme())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
