import { describe, it, expect } from 'vitest'
import { canModerate, canAdminister, isAnon, isLoggedIn } from './roles'
import type { AuthUser } from '../context/AuthContext'

function makeUser(role: AuthUser['role']): AuthUser {
  return { id: 'u1', username: 'test', role, token: 't' }
}

describe('roles', () => {
  describe('canModerate', () => {
    it('false para null', () => {
      expect(canModerate(null)).toBe(false)
    })
    it('false para ANON y USER', () => {
      expect(canModerate(makeUser('ANON'))).toBe(false)
      expect(canModerate(makeUser('USER'))).toBe(false)
    })
    it('true para MODERATOR y ADMIN', () => {
      expect(canModerate(makeUser('MODERATOR'))).toBe(true)
      expect(canModerate(makeUser('ADMIN'))).toBe(true)
    })
  })

  describe('canAdminister', () => {
    it('solo true para ADMIN', () => {
      expect(canAdminister(null)).toBe(false)
      expect(canAdminister(makeUser('ANON'))).toBe(false)
      expect(canAdminister(makeUser('USER'))).toBe(false)
      expect(canAdminister(makeUser('MODERATOR'))).toBe(false)
      expect(canAdminister(makeUser('ADMIN'))).toBe(true)
    })
  })

  describe('isAnon', () => {
    it('true para null o ANON', () => {
      expect(isAnon(null)).toBe(true)
      expect(isAnon(makeUser('ANON'))).toBe(true)
    })
    it('false para cualquier rol con sesión real', () => {
      expect(isAnon(makeUser('USER'))).toBe(false)
      expect(isAnon(makeUser('MODERATOR'))).toBe(false)
      expect(isAnon(makeUser('ADMIN'))).toBe(false)
    })
  })

  describe('isLoggedIn', () => {
    it('false para null o ANON', () => {
      expect(isLoggedIn(null)).toBe(false)
      expect(isLoggedIn(makeUser('ANON'))).toBe(false)
    })
    it('true para USER/MODERATOR/ADMIN', () => {
      expect(isLoggedIn(makeUser('USER'))).toBe(true)
      expect(isLoggedIn(makeUser('MODERATOR'))).toBe(true)
      expect(isLoggedIn(makeUser('ADMIN'))).toBe(true)
    })
  })

  it('isAnon y isLoggedIn son complementarios', () => {
    const roles: AuthUser['role'][] = ['ANON', 'USER', 'MODERATOR', 'ADMIN']
    for (const r of roles) {
      const u = makeUser(r)
      expect(isAnon(u)).toBe(!isLoggedIn(u))
    }
  })
})
