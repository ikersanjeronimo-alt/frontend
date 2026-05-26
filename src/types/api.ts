export type UserRole = 'ANON' | 'USER' | 'MODERATOR' | 'ADMIN'

export interface ApiUser {
  id: string
  username: string
  role: UserRole
}

export interface AuthResponse {
  token: string
  user: ApiUser
}

export interface ApiCommunity {
  id: string
  emoji: string
  name: string
  mod: string
  desc: string
  members: number
  online: number
  category: string
  joined: boolean
  /** Mensajes sin leer para el usuario actual. */
  unread?: number
  /** Nota fijada por el moderador, si la hay. */
  pinnedNote?: string
}

export interface ApiChatMember {
  username: string
  initials: string
}

export interface ApiDashboardMessage {
  id: string
  communityId: string
  community: string
  username: string
  text: string
  time: string
}

export interface ApiBottleStory {
  text: string
  time: string
}

export interface ApiModerationMember {
  username: string
  community: string
  joined: string
  reports: number
}

export interface ApiMessage {
  id: string
  username: string
  text: string
  time: string
  own: boolean
}

export interface ApiEvent {
  id: string
  title: string
  host: string
  date: string
  time: string
  duration: string
  spots: number
  total: number
  tags: string[]
  desc: string
  joined: boolean
  /** Número de personas que han marcado "Me interesa". No incluye al usuario actual. */
  interestedCount?: number
}

export interface ApiStory {
  id: string
  lat: number
  lng: number
  username: string
  text: string
  time: string
  emoji: string
  own?: boolean
}

export interface ApiBottle {
  id: string
  text: string
  username: string
  time: string
}

export interface ApiPrivateMessage {
  id: string
  /** 'user' = el usuario actual, 'professional' = el profesional con el que chatea. */
  from: 'user' | 'professional'
  text: string
  time: string
}

export interface ApiProfessional {
  id: string
  name: string
  specialty: 'psicologo' | 'terapeuta' | 'psiquiatra'
  tags: string[]
  availability: 'now' | 'today' | 'tomorrow'
  availableAt?: string
  bio?: string
}

export interface ApiReport {
  id: string
  type: 'message' | 'profile'
  reporter: string
  reported: string
  content: string
  reason: string
  community: string
  time: string
  status: 'pending' | 'resolved' | 'dismissed'
}

export interface ApiProfile {
  username: string
  role: UserRole
  joinedAt: string
  stats: {
    messages: number
    communities: number
    events: number
    stories: number
    bottles: number
  }
  activity: ApiActivityItem[]
  topics: string[]
}

export interface ApiActivityItem {
  id: string
  icon: string
  text: string
  time: string
}

export interface ApiModProfile {
  name: string
  lastName: string
  username: string
  email: string
  /** Solo para MODERATOR. ADMIN no tiene empresa. */
  company?: string
}

export interface ApiSettings {
  anonProfile: boolean
  onlineStatus: boolean
  activityHistory: boolean
  notifMessages: boolean
  notifEvents: boolean
  notifEmail: boolean
  lang: string
}

export type ModRole = 'PROFESSIONAL' | 'ADMINISTRATOR'

export type Profession = 'Psicólogo' | 'Terapeuta' | 'Psiquiatra'

export type Specialization =
  | 'Ansiedad'
  | 'Depresión'
  | 'Estrés'
  | 'Duelo'
  | 'Autoestima'
  | 'Relaciones'

export interface RegisterModPayload {
  name: string
  lastName: string
  username: string
  email: string
  password: string
  role: ModRole
  // Solo para PROFESSIONAL — los ADMINISTRATOR no los tienen
  company?: string
  profession?: Profession
  specialization?: Specialization
}

// ── 2FA TOTP (Google Authenticator) ──────────────────────────────
// Flujo de moderadores/administradores:
//  1. POST /api/auth/register/mod         → RegisterModEnrollment (QR)
//  2. POST /api/auth/register/mod/verify  → 204 (cuenta activa)
//  3. POST /api/auth/login/mod            → LoginModChallenge (requires2fa)
//  4. POST /api/auth/login/mod/verify     → AuthResponse (token + user)

export interface RegisterModEnrollment {
  /** Secreto Base32. Se muestra como fallback si el usuario no puede escanear el QR. */
  secret: string
  /** URI otpauth://totp/... que se codifica en el QR. */
  otpauthUri: string
  /** El email que se usará luego para verificar — eco del payload, útil para no perderlo en el front. */
  email: string
}

export interface LoginModChallenge {
  requires2fa: true
  /** Token corto que identifica la sesión de login en curso. Se manda en /verify. */
  challengeId: string
}

export interface VerifyTotpPayload {
  email: string
  code: string
}

export interface VerifyLoginPayload {
  challengeId: string
  code: string
}