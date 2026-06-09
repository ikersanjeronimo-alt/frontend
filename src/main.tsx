import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './lib/i18n'
import App from './App.tsx'
import { applyTheme, getInitialTheme } from './lib/theme'
import { initStoriesWS } from './services/storiesWS.ts'
import { initEventsWS } from './services/eventsWS.ts'
import { initCommunitiesWS } from './services/communitiesWS.ts'
import { initPrivateChatWS } from './services/privChatWS.ts'
import { initNotificationsWS } from './services/notificationsWS.ts'

// Registra los callbacks de suscripción STOMP (se ejecutan cuando el cliente
// conecta). NO se llama initWS() aquí: la conexión la arranca AuthContext vía
// syncWSAuth() en cuanto hay token, para que el primer CONNECT ya lleve el JWT
// y no lo rechace el backend (evita el error STOMP transitorio en la 1ª carga).
initStoriesWS()
initEventsWS()
initCommunitiesWS()
initPrivateChatWS()
initNotificationsWS()

// Aplicar tema antes del primer render para evitar parpadeo.
applyTheme(getInitialTheme())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
