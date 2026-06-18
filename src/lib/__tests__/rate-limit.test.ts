// ============================================================
// Tests unitaires — Rate Limiting
// ============================================================

import {
  checkRateLimit,
  RATE_LIMIT_PRESETS,
  getRateLimitHeaders,
} from '../rate-limit'

// Helper to create mock NextRequest
function createMockRequest(ip: string = '127.0.0.1'): any {
  return {
    headers: new Headers({
      'x-forwarded-for': ip,
    }),
    method: 'GET',
  } as any
}

describe('Rate Limiting', () => {
  describe('RATE_LIMIT_PRESETS', () => {
    test('a une configuration pour auth', () => {
      expect(RATE_LIMIT_PRESETS.auth).toBeDefined()
      expect(RATE_LIMIT_PRESETS.auth.maxRequests).toBeGreaterThan(0)
      expect(RATE_LIMIT_PRESETS.auth.windowMs).toBeGreaterThan(0)
    })

    test('a une configuration pour payment', () => {
      expect(RATE_LIMIT_PRESETS.payment).toBeDefined()
    })

    test('a une configuration pour admin', () => {
      expect(RATE_LIMIT_PRESETS.admin).toBeDefined()
    })

    test('a une configuration pour general', () => {
      expect(RATE_LIMIT_PRESETS.general).toBeDefined()
    })

    test('a une configuration pour passwordReset', () => {
      expect(RATE_LIMIT_PRESETS.passwordReset).toBeDefined()
      expect(RATE_LIMIT_PRESETS.passwordReset.maxRequests).toBeLessThanOrEqual(10)
    })
  })

  describe('checkRateLimit', () => {
    test('retourne null pour une première requête (autorise)', () => {
      const request = createMockRequest('192.168.1.100')
      const result = checkRateLimit(request, RATE_LIMIT_PRESETS.general)
      expect(result).toBeNull()
    })

    test('bloque après dépassement de la limite', () => {
      const request = createMockRequest('192.168.1.101')
      // Make many requests to exceed limit
      let lastResult = null
      for (let i = 0; i <= RATE_LIMIT_PRESETS.general.maxRequests + 1; i++) {
        lastResult = checkRateLimit(request, RATE_LIMIT_PRESETS.general)
      }
      expect(lastResult).not.toBeNull()
      expect(lastResult?.status).toBe(429)
    })

    test('inclut Retry-After dans la réponse de blocage', () => {
      const request = createMockRequest('192.168.1.102')
      let blockedResponse = null
      for (let i = 0; i <= RATE_LIMIT_PRESETS.general.maxRequests + 1; i++) {
        const result = checkRateLimit(request, RATE_LIMIT_PRESETS.general)
        if (result) blockedResponse = result
      }
      expect(blockedResponse?.headers.get('Retry-After')).toBeTruthy()
    })

    test('traite les IPs séparément', () => {
      const req1 = createMockRequest('10.0.0.1')
      const req2 = createMockRequest('10.0.0.2')
      // Use up most of req1's quota
      for (let i = 0; i < RATE_LIMIT_PRESETS.general.maxRequests - 1; i++) {
        checkRateLimit(req1, RATE_LIMIT_PRESETS.general)
      }
      // req2 should still be allowed
      const result = checkRateLimit(req2, RATE_LIMIT_PRESETS.general)
      expect(result).toBeNull()
    })
  })

  describe('getRateLimitHeaders', () => {
    test('retourne les en-têtes X-RateLimit', () => {
      const request = createMockRequest('10.1.1.1')
      const headers = getRateLimitHeaders(request, RATE_LIMIT_PRESETS.general)
      expect(headers['X-RateLimit-Limit']).toBeDefined()
      expect(headers['X-RateLimit-Remaining']).toBeDefined()
      expect(parseInt(headers['X-RateLimit-Limit'])).toBe(RATE_LIMIT_PRESETS.general.maxRequests)
    })
  })
})
