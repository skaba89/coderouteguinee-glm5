// ============================================================
// Tests unitaires — Système CSRF
// ============================================================

import {
  generateCsrfToken,
  validateCsrfToken,
  isCsrfRequiredMethod,
} from '../csrf'

describe('CSRF Protection', () => {
  describe('generateCsrfToken', () => {
    test('génère un token au format correct', async () => {
      const token = await generateCsrfToken()
      expect(token).toBeTruthy()
      expect(typeof token).toBe('string')
      expect(token).toContain('.')
      const [raw, signature] = token.split('.')
      expect(raw).toHaveLength(64) // 32 bytes in hex
      expect(signature).toHaveLength(64) // SHA-256 hex
    })

    test('génère des tokens uniques à chaque appel', async () => {
      const token1 = await generateCsrfToken()
      const token2 = await generateCsrfToken()
      expect(token1).not.toBe(token2)
    })
  })

  describe('validateCsrfToken', () => {
    test('valide un token généré correctement', async () => {
      const token = await generateCsrfToken()
      const isValid = await validateCsrfToken(token)
      expect(isValid).toBe(true)
    })

    test('rejette un token invalide', async () => {
      const isValid = await validateCsrfToken('invalid.token')
      expect(isValid).toBe(false)
    })

    test('rejette un token vide', async () => {
      const isValid = await validateCsrfToken('')
      expect(isValid).toBe(false)
    })

    test('rejette un token sans séparateur', async () => {
      const isValid = await validateCsrfToken('invalidtoken')
      expect(isValid).toBe(false)
    })

    test('rejette un token avec signature modifiée', async () => {
      const token = await generateCsrfToken()
      const [raw] = token.split('.')
      const tampered = `${raw}.fakefakefakefakefakefakefakefakefakefakefakefakefakefakefakefake`
      const isValid = await validateCsrfToken(tampered)
      expect(isValid).toBe(false)
    })
  })

  describe('isCsrfRequiredMethod', () => {
    test('retourne true pour POST', () => {
      expect(isCsrfRequiredMethod('POST')).toBe(true)
    })

    test('retourne true pour PUT', () => {
      expect(isCsrfRequiredMethod('PUT')).toBe(true)
    })

    test('retourne true pour PATCH', () => {
      expect(isCsrfRequiredMethod('PATCH')).toBe(true)
    })

    test('retourne true pour DELETE', () => {
      expect(isCsrfRequiredMethod('DELETE')).toBe(true)
    })

    test('retourne false pour GET', () => {
      expect(isCsrfRequiredMethod('GET')).toBe(false)
    })

    test('retourne false pour HEAD', () => {
      expect(isCsrfRequiredMethod('HEAD')).toBe(false)
    })

    test('retourne false pour OPTIONS', () => {
      expect(isCsrfRequiredMethod('OPTIONS')).toBe(false)
    })

    test('insensible à la casse', () => {
      expect(isCsrfRequiredMethod('post')).toBe(true)
      expect(isCsrfRequiredMethod('Get')).toBe(false)
    })
  })
})
