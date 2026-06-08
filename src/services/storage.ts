/**
 * Acceso centralizado a localStorage.
 *
 * Razones para tener este módulo en vez de `localStorage.*` directo:
 *  - **Una sola fuente de verdad para las keys `sys_*`** (antes había 4
 *    sitios con `const TOKEN_KEY = 'sys_token'` duplicado).
 *  - **Manejo uniforme de errores**: quota exhausted, modo privado de Safari,
 *    storage deshabilitado por el usuario. Todos los métodos son best-effort
 *    y no lanzan.
 *  - **Validación y tipado de payloads JSON**: cualquier JSON corrupto se
 *    descarta silenciosamente y devuelve `null`.
 *  - **Punto único de migración** si el día de mañana movemos cookies HttpOnly,
 *    IndexedDB, o ambos: solo cambia este archivo.
 */

const KEYS = {
  token:          'sys_token',
  theme:          'sys_theme',
  lang:           'sys_lang',
  bannedWords:    'sys_banned_words',
  eventInterests: 'sys_event_interests',
  dailyMood:      'sys_daily_mood',
} as const

// ── Helpers internos ──────────────────────────────────────────

function safeGet(key: string): string | null {
  try { return localStorage.getItem(key) } catch { return null }
}

function safeSet(key: string, value: string): void {
  try { localStorage.setItem(key, value) } catch { /* quota / privado */ }
}

function safeRemove(key: string): void {
  try { localStorage.removeItem(key) } catch { /* */ }
}

function getJson<T>(key: string, validate: (v: unknown) => v is T): T | null {
  const raw = safeGet(key)
  if (!raw) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    return validate(parsed) ? parsed : null
  } catch {
    return null
  }
}

function setJson(key: string, value: unknown): void {
  safeSet(key, JSON.stringify(value))
}

// ── JWT del usuario ────────────────────────────────────────────

export const tokenStorage = {
  get():    string | null { return safeGet(KEYS.token) },
  set(t: string):   void   { safeSet(KEYS.token, t) },
  clear():          void   { safeRemove(KEYS.token) },
}

// ── Tema (light/dark) ──────────────────────────────────────────

export type StoredTheme = 'light' | 'dark'

export const themeStorage = {
  get(): StoredTheme | null {
    const v = safeGet(KEYS.theme)
    return v === 'light' || v === 'dark' ? v : null
  },
  set(theme: StoredTheme): void { safeSet(KEYS.theme, theme) },
}

// ── Idioma ─────────────────────────────────────────────────────

export const langStorage = {
  get(): string | null { return safeGet(KEYS.lang) },
  set(lang: string): void { safeSet(KEYS.lang, lang) },
}

// ── Palabras prohibidas (lista del filtro de moderación) ───────

const isStringArray = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every(x => typeof x === 'string')

export const bannedWordsStorage = {
  get(): string[] | null { return getJson(KEYS.bannedWords, isStringArray) },
  set(words: string[]): void { setJson(KEYS.bannedWords, words) },
}

// ── Eventos "Me interesa" ──────────────────────────────────────

export const eventInterestsStorage = {
  get(): string[] | null { return getJson(KEYS.eventInterests, isStringArray) },
  set(ids: string[]): void { setJson(KEYS.eventInterests, ids) },
}

// ── Bienestar diario (mood, una vez por día) ───────────────────

interface StoredDailyMood { value: number; date: string }

const isStoredDailyMood = (v: unknown): v is StoredDailyMood =>
  typeof v === 'object' && v !== null &&
  typeof (v as StoredDailyMood).value === 'number' &&
  typeof (v as StoredDailyMood).date === 'string'

const todayStr = () => new Date().toISOString().slice(0, 10)

export const dailyMoodStorage = {
  getToday(): number | null {
    const stored = getJson(KEYS.dailyMood, isStoredDailyMood)
    return stored?.date === todayStr() ? stored.value : null
  },
  setToday(value: number): void {
    setJson(KEYS.dailyMood, { value, date: todayStr() })
  },
}

