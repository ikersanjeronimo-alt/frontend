import { describe, it, expect, beforeEach } from 'vitest'
import {
  maskWord,
  maskBannedWords,
  addBannedWord,
  removeBannedWord,
  updateBannedWord,
  getBannedWords,
} from './bannedWords'

// Reset entre tests: el store es singleton de módulo. Resetamos el localStorage
// y forzamos un re-load... pero el módulo ya leyó al cargar. Como hack barato,
// limpiamos la lista actual a mano usando los exports.
function clearAll() {
  // Borrar todos los elementos uno por uno (los índices van bajando).
  let n = getBannedWords().length
  while (n > 0) {
    removeBannedWord(0)
    n = getBannedWords().length
  }
}

describe('bannedWords', () => {
  beforeEach(() => {
    localStorage.clear()
    clearAll()
  })

  describe('maskWord', () => {
    it('mantiene la primera letra, asteriscos el resto', () => {
      expect(maskWord('puta')).toBe('p***')
      expect(maskWord('idiota')).toBe('i*****')
    })
    it('palabras de 1 caracter no se enmascaran', () => {
      expect(maskWord('a')).toBe('a')
      expect(maskWord('')).toBe('')
    })
  })

  describe('maskBannedWords', () => {
    it('censura palabras exactas case-insensitive', () => {
      const list = ['puta', 'idiota']
      expect(maskBannedWords('eres un idiota', list)).toBe('eres un i*****')
      expect(maskBannedWords('IDIOTA en mayusculas', list)).toBe('I***** en mayusculas')
    })
    it('respeta unicode word boundary — no censura dentro de palabras válidas', () => {
      // "puta" dentro de "disputa" no debe matchear
      expect(maskBannedWords('eso fue una disputa enorme', ['puta'])).toBe('eso fue una disputa enorme')
      // "puta" como palabra suelta SÍ
      expect(maskBannedWords('eres una puta loca', ['puta'])).toBe('eres una p*** loca')
    })
    it('no toca texto sin matches', () => {
      expect(maskBannedWords('todo bien por aqui', ['malo'])).toBe('todo bien por aqui')
    })
    it('devuelve el texto tal cual si la lista esta vacia', () => {
      expect(maskBannedWords('idiota', [])).toBe('idiota')
    })
    it('respeta multiples ocurrencias', () => {
      expect(maskBannedWords('idiota idiota IDIOTA', ['idiota'])).toBe('i***** i***** I*****')
    })
  })

  describe('addBannedWord', () => {
    it('añade palabras normalizadas (trim + lowercase)', () => {
      const before = getBannedWords().length
      const res = addBannedWord('  HOLA  ')
      expect(res.ok).toBe(true)
      expect(getBannedWords()[before]).toBe('hola')
    })
    it('rechaza palabras vacias', () => {
      const res = addBannedWord('   ')
      expect(res.ok).toBe(false)
      expect(res.error).toBeDefined()
    })
    it('rechaza duplicados case-insensitive', () => {
      addBannedWord('puta')
      const res = addBannedWord('PUTA')
      expect(res.ok).toBe(false)
    })
  })

  describe('updateBannedWord', () => {
    it('actualiza por indice', () => {
      addBannedWord('hola')
      const idx = getBannedWords().length - 1
      const res = updateBannedWord(idx, 'adios')
      expect(res.ok).toBe(true)
      expect(getBannedWords()[idx]).toBe('adios')
    })
    it('rechaza indice fuera de rango', () => {
      const res = updateBannedWord(999, 'foo')
      expect(res.ok).toBe(false)
    })
    it('rechaza si el nuevo valor duplica otro existente', () => {
      addBannedWord('uno')
      addBannedWord('dos')
      const n = getBannedWords().length
      const res = updateBannedWord(n - 1, 'UNO')
      expect(res.ok).toBe(false)
    })
  })

  describe('removeBannedWord', () => {
    it('elimina por indice', () => {
      addBannedWord('temp')
      const before = getBannedWords().length
      removeBannedWord(before - 1)
      expect(getBannedWords().length).toBe(before - 1)
    })
    it('ignora indice fuera de rango sin tirar', () => {
      const before = getBannedWords().length
      removeBannedWord(999)
      expect(getBannedWords().length).toBe(before)
    })
  })
})
