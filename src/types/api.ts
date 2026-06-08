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
  modUserId?: string | null
  desc: string
  members: number
  online: number
  category: string
  joined: boolean
  /** Mensajes sin leer para el usuario actual. */
  unread?: number
  /** Nota fijada por el moderador, si la hay. */
  pinnedNote?: string
  chatClosed?: boolean
}

export interface ApiChatMember {
  userId: string
  username: string
  initials: string
  online: boolean
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
  id: string
  username: string
  community: string
  joined: string
  reports: number
  banned: boolean
}

export interface ApiStaffMember {
  id: string
  name: string
  username: string
  email: string
  /** Rol crudo del backend. */
  role: 'PROFESSIONAL' | 'ADMINISTRATOR'
  company: string | null
  profession: string | null
  joined: string
  /** Tiene alguna sesión WebSocket viva ahora mismo. */
  online: boolean
}

export interface UpdateStaffPayload {
  name?: string
  email?: string
  company?: string
  profession?: string
}

export interface ApiMessage {
  id: string
  username: string
  text: string
  time: string
  own: boolean
  action?: 'DELETE'
}

export interface ApiEvent {
  id: string | number
  title: string
  host?: string
  date: string
  time?: string
  duration?: string
  tags: string[]
  desc?: string
  description?: string
  place?: string
  joined?: boolean
  reaction?: number
  topic?: string
  /** Número de personas que han marcado "Me interesa". No incluye al usuario actual. */
  interestedCount?: number
  /** Estado del usuario actual para este evento. */
  interested?: boolean
}

export interface ApiStory {
  id: string
  latitude: number
  longitude: number
  username: string
  message: string
  time: string
  emoji: string
  own?: boolean
}

export interface ApiBottle {
  message: string
}

export interface ApiPrivateMessage {
  id: string
  /** 'user' = el usuario actual, 'professional' = el profesional con el que chatea. */
  from: 'user' | 'professional'
  text: string
  time: string
}

export interface ApiPrivateConversation {
  userId: string
  username: string
  lastMessage: string
  lastTime: string
}

export interface ApiProfessional {
  id: string
  name: string
  specialty: 'psicologo' | 'terapeuta' | 'psiquiatra'
  tags: string[]
  online: boolean
  bio?: string
}

export interface ApiReport {
  id: string
  type: 'story' | 'message'
  reporter: string
  reported: string
  content: string
  reason: string
  community: string | null
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
//  1. POST /api/auth/register/mod            → RegisterModEnrollment (URI del QR)
//  2. POST /api/auth/register/mod/2fa/qr     → 204 (primer código validado, cuenta activa)
//  3. POST /api/auth/login/mod               → LoginModChallenge (challengeId)
//  4. POST /api/auth/login/mod/2fa/code      → AuthResponse (token + user)

export interface RegisterModEnrollment {
  /** Secreto Base32. Se muestra como fallback si el usuario no puede escanear el QR. */
  secret: string
  /** URI otpauth://totp/... que se codifica en el QR. */
  otpauthUri: string
  /** El email que se usará luego para verificar — eco del payload. */
  email: string
}

export interface LoginModChallenge {
  requires2fa: true
  /** Token corto que identifica la sesión de login en curso. Se manda en /2fa/code. */
  challengeId: string
}

export interface VerifyTotpPayload {
  email: string
  code: string
}
