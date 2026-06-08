import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { MainLayout } from './components/layout/MainLayout'
import { BareLayout } from './components/layout/BareLayout'
import { RequireRole } from './components/auth/RequireRole'
import { PageState } from './components/ui/PageState'
import { ErrorBoundary } from './components/ui/ErrorBoundary'

// Eager: pantallas frecuentes o ligeras
import { LandingPage }       from './pages/LandingPage'
import { OnboardingPage }    from './pages/OnboardingPage'
import { LoginPage }         from './pages/LoginPage'
import { DashboardPage }     from './pages/DashboardPage'
import { ProfilePage }       from './pages/ProfilePage'
import { SettingsPage }      from './pages/SettingsPage'
import { ProfessionalsPage } from './pages/ProfessionalsPage'
import { PrivateChatPage }   from './pages/PrivateChatPage'
import { CommunityListPage }   from './pages/CommunityListPage'
import { CommunityCreatePage } from './pages/CommunityCreatePage'
import { CommunityChatPage }   from './pages/CommunityChatPage'
import { EventListPage }     from './pages/EventListPage'
import { EventDetailPage }   from './pages/EventDetailPage'
import { EventCreatePage }   from './pages/EventCreatePage'
import { TimeMachinePage }   from './pages/TimeMachinePage'
import { BottleMessagePage } from './pages/BottleMessagePage'
import { NotFoundPage }      from './pages/NotFoundPage'

// Lazy: pantallas pesadas o de uso poco frecuente.
// ModLogin/ModRegister arrastran `qrcode` (~80KB) y `otpauth` (~10KB) — los
// usuarios ANON/USER nunca los necesitan, así que salen del bundle principal.
const MapPage         = lazy(() => import('./pages/MapPage').then(m => ({ default: m.MapPage })))
const ModerationPage  = lazy(() => import('./pages/ModerationPage').then(m => ({ default: m.ModerationPage })))
const ModLoginPage    = lazy(() => import('./pages/ModLoginPage').then(m => ({ default: m.ModLoginPage })))
const ModRegisterPage = lazy(() => import('./pages/ModRegisterPage').then(m => ({ default: m.ModRegisterPage })))

import './App.css'

export default function App() {
  return (
    <ErrorBoundary>
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<PageState loading />}>
          <Routes>

            {/* ── Layout principal (Navbar + Footer) ─────────────────── */}
            <Route element={<MainLayout />}>
              <Route path="/"                    element={<LandingPage />} />
              <Route path="/onboarding"          element={<OnboardingPage />} />
              <Route path="/dashboard"           element={<DashboardPage />} />
              <Route path="/perfil"              element={<ProfilePage />} />
              <Route path="/configuracion"       element={<SettingsPage />} />
              <Route path="/profesionales"       element={<ProfessionalsPage />} />
              <Route path="/comunidades"         element={<CommunityListPage />} />
              <Route path="/comunidades/nueva"  element={<RequireRole roles={['MODERATOR', 'ADMIN']}><CommunityCreatePage /></RequireRole>} />
              <Route path="/eventos"             element={<EventListPage />} />
              <Route path="/eventos/nuevo"       element={<RequireRole roles={['MODERATOR', 'ADMIN']}><EventCreatePage /></RequireRole>} />
              <Route path="/eventos/:eventId"    element={<EventDetailPage />} />
              <Route path="/maquina-del-tiempo"  element={<TimeMachinePage />} />
              <Route path="/botella"             element={<BottleMessagePage />} />
              <Route path="/mapa"                element={<MapPage />} />
              <Route path="/moderacion"          element={<RequireRole roles={['MODERATOR', 'ADMIN']}><ModerationPage /></RequireRole>} />
              <Route path="*"                    element={<NotFoundPage />} />
            </Route>

            {/* ── Layout sin Footer (chats y auth) ───────────────────── */}
            {/* Chats: ocupan calc(100vh - 64px) — el Footer rompería el layout.
                Auth: card central con su propio "header" — el Footer distrae. */}
            <Route element={<BareLayout />}>
              <Route path="/login"                     element={<LoginPage />} />
              <Route path="/loginmod"                  element={<ModLoginPage />} />
              <Route path="/modregister"               element={<RequireRole roles={['ADMIN']}><ModRegisterPage initialMode="moderador" backTo="/moderacion" /></RequireRole>} />
              <Route path="/admin/moderadores/nuevo"    element={<RequireRole roles={['ADMIN']}><ModRegisterPage initialMode="moderador" backTo="/moderacion" /></RequireRole>} />
              <Route path="/chat/:professionalId/:userId" element={<PrivateChatPage />} />
              <Route path="/chat/:professionalId"      element={<PrivateChatPage />} />
              <Route path="/comunidades/:comunidadId"  element={<CommunityChatPage />} />
            </Route>

          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
    </ErrorBoundary>
  )
}
