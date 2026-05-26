import { describe, it, expect, beforeEach } from 'vitest'
import * as OTPAuth from 'otpauth'
import {
  generateMockEnrollment,
  verifyMockCode,
  getMockAccount,
  hasMockAccount,
} from './totp'

describe('totp (mock TOTP server-side)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('generateMockEnrollment', () => {
    it('crea cuenta persistida con secret y URI otpauth', () => {
      const email = 'mod@example.com'
      const result = generateMockEnrollment(email, 'modUser', 'MODERATOR')

      expect(result.secret).toMatch(/^[A-Z2-7]+$/)  // Base32
      expect(result.otpauthUri).toMatch(/^otpauth:\/\/totp\//)
      expect(result.otpauthUri).toContain(encodeURIComponent('ShareYourStory'))

      const account = getMockAccount(email)
      expect(account?.username).toBe('modUser')
      expect(account?.role).toBe('MODERATOR')
      expect(account?.secret).toBe(result.secret)
    })

    it('reemplaza la cuenta si se enrola de nuevo con el mismo email', () => {
      const email = 'mod@example.com'
      const first  = generateMockEnrollment(email, 'first', 'MODERATOR')
      const second = generateMockEnrollment(email, 'second', 'ADMIN')

      expect(second.secret).not.toBe(first.secret)
      const account = getMockAccount(email)
      expect(account?.username).toBe('second')
      expect(account?.role).toBe('ADMIN')
    })

    it('email case-insensitive: getMockAccount funciona con cualquier casing', () => {
      generateMockEnrollment('MOD@example.com', 'X', 'ADMIN')
      expect(hasMockAccount('mod@example.com')).toBe(true)
      expect(hasMockAccount('MOD@EXAMPLE.COM')).toBe(true)
    })
  })

  describe('verifyMockCode', () => {
    it('acepta el código TOTP válido del momento', () => {
      const email = 'mod@example.com'
      const { secret } = generateMockEnrollment(email, 'modUser', 'MODERATOR')

      // Generamos el código que un autenticador real produciría AHORA
      const totp = new OTPAuth.TOTP({
        issuer: 'ShareYourStory',
        label: email,
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromBase32(secret),
      })
      const validCode = totp.generate()

      expect(verifyMockCode(email, validCode)).toBe(true)
    })

    it('rechaza códigos arbitrarios', () => {
      generateMockEnrollment('mod@example.com', 'modUser', 'MODERATOR')
      expect(verifyMockCode('mod@example.com', '000000')).toBe(false)
      expect(verifyMockCode('mod@example.com', '999999')).toBe(false)
    })

    it('rechaza si la cuenta no existe', () => {
      expect(verifyMockCode('noexiste@example.com', '123456')).toBe(false)
    })
  })

  describe('hasMockAccount', () => {
    it('false si no hay cuenta para ese email', () => {
      expect(hasMockAccount('nadie@example.com')).toBe(false)
    })
    it('true tras enrolar', () => {
      generateMockEnrollment('si@example.com', 'u', 'MODERATOR')
      expect(hasMockAccount('si@example.com')).toBe(true)
    })
  })

  describe('getMockAccount con storage corrupto', () => {
    it('devuelve null si el JSON guardado no tiene la forma esperada', () => {
      // Escribimos basura directamente, simulando un valor corrupto en la key.
      localStorage.setItem('sys_mod_account_mod@example.com', '{"foo":"bar"}')
      expect(getMockAccount('mod@example.com')).toBeNull()
    })
    it('devuelve null si el JSON es inválido', () => {
      localStorage.setItem('sys_mod_account_mod@example.com', '{{not json')
      expect(getMockAccount('mod@example.com')).toBeNull()
    })
  })
})
