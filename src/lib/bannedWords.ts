/**
 * Lista compartida de palabras filtradas. Vive aquí (no en `ModerationPage`)
 * porque el chat de comunidades también la usa para censurar mensajes en
 * tiempo de render. Persistencia en localStorage hasta que el backend tenga
 * el endpoint correspondiente.
 *
 * Cuando exista `GET/POST/PATCH/DELETE /api/moderation/banned-words`:
 *  - Reemplazar `loadFromStorage` por una llamada al servicio.
 *  - El filtro pasa a aplicarse server-side antes de almacenar mensajes;
 *    el render del cliente puede dejar de mapear (o conservarlo como red de
 *    seguridad).
 */
import { bannedWordsStorage } from '../services/storage'

const INITIAL: readonly string[] = ['puta', 'idiota', 'imbécil', 'tonto']

type Listener = (words: string[]) => void

const listeners = new Set<Listener>()
let words: string[] = bannedWordsStorage.get() ?? [...INITIAL]

function persist(): void {
  bannedWordsStorage.set(words)
}

function notify(): void {
  listeners.forEach(l => l(words))
}

function normalize(w: string): string {
  return w.trim().toLowerCase()
}

export function getBannedWords(): string[] {
  return words
}

export function subscribeBannedWords(fn: Listener): () => void {
  listeners.add(fn)
  return () => { listeners.delete(fn) }
}

export interface BannedWordResult {
  ok: boolean
  error?: string
}

export function addBannedWord(raw: string): BannedWordResult {
  const w = normalize(raw)
  if (!w) return { ok: false, error: 'La palabra está vacía.' }
  if (words.some(x => x.toLowerCase() === w)) {
    return { ok: false, error: 'Esa palabra ya está en la lista.' }
  }
  words = [...words, w]
  persist()
  notify()
  return { ok: true }
}

export function removeBannedWord(idx: number): void {
  if (idx < 0 || idx >= words.length) return
  words = words.filter((_, i) => i !== idx)
  persist()
  notify()
}

export function updateBannedWord(idx: number, raw: string): BannedWordResult {
  if (idx < 0 || idx >= words.length) return { ok: false, error: 'Índice inválido.' }
  const w = normalize(raw)
  if (!w) return { ok: false, error: 'La palabra está vacía.' }
  if (words.some((x, i) => i !== idx && x.toLowerCase() === w)) {
    return { ok: false, error: 'Esa palabra ya está en la lista.' }
  }
  words = words.map((x, i) => i === idx ? w : x)
  persist()
  notify()
  return { ok: true }
}

/** Censura: la primera letra se mantiene, el resto pasa a asteriscos. */
export function maskWord(word: string): string {
  if (word.length <= 1) return word
  return word[0] + '*'.repeat(word.length - 1)
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Aplica el filtro al texto. Word boundary unicode-aware (para que no
 * matchee dentro de palabras válidas, p. ej. "puta" en "disputa") y
 * case-insensitive. Conserva el casing original de la primera letra.
 */
export function maskBannedWords(text: string, list: string[] = words): string {
  if (!text || list.length === 0) return text
  const pattern = new RegExp(
    `(?<!\\p{L})(${list.map(escapeRegex).join('|')})(?!\\p{L})`,
    'giu',
  )
  return text.replace(pattern, m => m[0] + '*'.repeat(m.length - 1))
}
