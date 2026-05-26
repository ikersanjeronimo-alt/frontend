import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { Navbar } from './components/layout/Navbar'
import { Footer } from './components/layout/Footer'
import { DemoModeBanner } from './components/layout/DemoModeBanner'
import { RequireRole } from './components/auth/RequireRole'
import { PageState } from './components/ui/PageState'

// Eager: pantallas frecuentes o ligeras
import { LandingPage }       from './pages/LandingPage'
import { OnboardingPage }    from './pages/OnboardingPage'
import { LoginPage }         from './pages/LoginPage'
import { DashboardPage }     from './pages/DashboardPage'
import { ProfilePage }       from './pages/ProfilePage'
import { SettingsPage }      from './pages/SettingsPage'
import { ProfessionalsPage } from './pages/ProfessionalsPage'
import { PrivateChatPage }   from './pages/PrivateChatPage'
import { CommunityListPage } from './pages/CommunityListPage'
import { CommunityChatPage } from './pages/CommunityChatPage'
import { EventListPage }     from './pages/EventListPage'
import { EventDetailPage }   from './pages/EventDetailPage'
import { EventCreatePage }   from './pages/EventCreatePage'
import { TimeMachinePage }   from './pages/TimeMachinePage'
import { BottleMessagePage } from './pages/BottleMessagePage'
import { ModLoginPage }      from './pages/ModLoginPage'
import { ModRegisterPage }   from './pages/ModRegisterPage'
import { NotFoundPage }      from './pages/NotFoundPage'

// Lazy: pantallas pesadas o de uso poco frecuente
const MapPage        = lazy(() => import('./pages/MapPage').then(m => ({ default: m.MapPage })))
const ModerationPage = lazy(() => import('./pages/ModerationPage').then(m => ({ default: m.ModerationPage })))

import './App.css'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DemoModeBanner />
        <Navbar />
        <Suspense fallback={<PageState loading />}>
        <Routes>
          <Route path="/"                    element={<LandingPage />} />
          <Route path="/onboarding"          element={<OnboardingPage />} />
          <Route path="/login"               element={<LoginPage />} />
          <Route path="/dashboard"           element={<DashboardPage />} />
          <Route path="/perfil"              element={<ProfilePage />} />
          <Route path="/configuracion"       element={<SettingsPage />} />
          <Route path="/profesionales"       element={<ProfessionalsPage />} />
          <Route path="/chat/:professionalId" element={<PrivateChatPage />} />
          <Route path="/comunidades"                    element={<CommunityListPage />} />
          <Route path="/comunidades/:comunidadId"     element={<CommunityChatPage />} />
          <Route path="/eventos"             element={<EventListPage />} />
          <Route path="/eventos/nuevo"       element={<RequireRole roles={['MODERATOR', 'ADMIN']}><EventCreatePage /></RequireRole>} />
          <Route path="/eventos/:eventId"    element={<EventDetailPage />} />
          <Route path="/maquina-del-tiempo"  element={<TimeMachinePage />} />
          <Route path="/botella"             element={<BottleMessagePage />} />
          <Route path="/mapa"                element={<MapPage />} />
          <Route path="/moderacion"          element={<RequireRole roles={['MODERATOR', 'ADMIN']}><ModerationPage /></RequireRole>} />
          <Route path="/loginmod"            element={<ModLoginPage />} />
          <Route path="/modregister"         element={<ModRegisterPage />} />
          <Route path="*"                    element={<NotFoundPage />} />
        </Routes>
        </Suspense>
        <Footer />
      </AuthProvider>
    </BrowserRouter>
  )
}
