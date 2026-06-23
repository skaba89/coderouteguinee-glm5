// ============================================================
// CodeRoute Guinée — Tests for geoblock module (Sprint 13)
// ============================================================

import { jest } from '@jest/globals'

// Mock maxmind — extract mock fn to avoid type inference issue
const mockOpen = jest.fn() as any
mockOpen.mockResolvedValue(null)
jest.mock('maxmind', () => ({
  open: mockOpen, // no DB loaded → fail open
}))

// Mock the redis module
const mockRedis: any = {
  getRedis: jest.fn(),
  isRedisAvailable: jest.fn(),
  cachedGet: jest.fn(),
}

jest.mock('@/lib/redis', () => mockRedis)

import {
  checkGeoBlock,
  resolveGeoPolicy,
  getClientIp,
  COUNTRY_NEIGHBORS,
  COUNTRY_DIASPORA,
} from '@/lib/geoblock'

function buildRequest(
  url: string,
  headers: Record<string, string> = {}
) {
  const h = new Headers()
  for (const [k, v] of Object.entries(headers)) {
    h.set(k, v)
  }
  return {
    nextUrl: new URL(url, 'https://staging.coderoute.gov.gn'),
    headers: h,
    method: 'GET',
    cookies: { get: () => undefined },
  } as any
}

beforeEach(() => {
  jest.clearAllMocks()
  mockRedis.isRedisAvailable.mockReturnValue(false)
  mockRedis.getRedis.mockResolvedValue(null)

  // Reset env vars
  delete process.env.GEOBLOCK_POLICY
  delete process.env.GEOBLOCK_ALLOWLIST_CIDR
  delete process.env.GEOBLOCK_FAIL_CLOSED
  delete process.env.MAXMIND_DB_PATH
})

describe('geoblock — policy resolution', () => {
  it('defaults to lenient when no env var', () => {
    expect(resolveGeoPolicy()).toBe('lenient')
  })

  it('respects GEOBLOCK_POLICY env var', () => {
    process.env.GEOBLOCK_POLICY = 'strict'
    expect(resolveGeoPolicy()).toBe('strict')
  })

  it('falls back to lenient on invalid value', () => {
    process.env.GEOBLOCK_POLICY = 'invalid'
    expect(resolveGeoPolicy()).toBe('lenient')
  })

  it('supports disabled mode', () => {
    process.env.GEOBLOCK_POLICY = 'disabled'
    expect(resolveGeoPolicy()).toBe('disabled')
  })
})

describe('geoblock — IP extraction', () => {
  it('prefers CF-Connecting-IP', () => {
    const req = buildRequest('/api/auth/login', {
      'cf-connecting-ip': '197.214.5.20',
      'x-forwarded-for': '41.82.156.10, 10.0.0.1',
    })
    expect(getClientIp(req)).toBe('197.214.5.20')
  })

  it('uses first X-Forwarded-For when no CF', () => {
    const req = buildRequest('/api/auth/login', {
      'x-forwarded-for': '41.82.156.10, 10.0.0.1',
    })
    expect(getClientIp(req)).toBe('41.82.156.10')
  })

  it('falls back to X-Real-IP', () => {
    const req = buildRequest('/api/auth/login', {
      'x-real-ip': '10.0.0.1',
    })
    expect(getClientIp(req)).toBe('10.0.0.1')
  })

  it('defaults to 127.0.0.1 if nothing', () => {
    const req = buildRequest('/api/auth/login')
    expect(getClientIp(req)).toBe('127.0.0.1')
  })
})

describe('geoblock — main check function', () => {
  it('returns null when policy is disabled', async () => {
    process.env.GEOBLOCK_POLICY = 'disabled'
    const req = buildRequest('/api/auth/login')
    const result = await checkGeoBlock(req)
    expect(result).toBeNull()
  })

  it('returns null for allowlisted CIDR', async () => {
    process.env.GEOBLOCK_POLICY = 'strict'
    process.env.GEOBLOCK_ALLOWLIST_CIDR = '10.0.0.0/8'
    const req = buildRequest('/api/auth/login', {
      'x-forwarded-for': '10.1.2.3',
    })
    const result = await checkGeoBlock(req)
    expect(result).toBeNull()
  })

  it('returns null for exact match in allowlist', async () => {
    process.env.GEOBLOCK_POLICY = 'strict'
    process.env.GEOBLOCK_ALLOWLIST_CIDR = '41.82.156.10'
    const req = buildRequest('/api/auth/login', {
      'x-forwarded-for': '41.82.156.10',
    })
    const result = await checkGeoBlock(req)
    expect(result).toBeNull()
  })

  it('fails open when country cannot be determined', async () => {
    process.env.GEOBLOCK_POLICY = 'strict'
    // No CF-IPCountry, no MaxMind DB loaded
    const req = buildRequest('/api/auth/login', {
      'x-forwarded-for': '41.82.156.10',
    })
    const result = await checkGeoBlock(req)
    expect(result).toBeNull()
  })

  it('returns 403 when CF-IPCountry is outside allowlist', async () => {
    process.env.GEOBLOCK_POLICY = 'strict' // GN only
    const req = buildRequest('/api/auth/login', {
      'cf-connecting-ip': '1.2.3.4',
      'cf-ipcountry': 'CN', // China, not in GN-only
    })
    const result = await checkGeoBlock(req)
    expect(result).not.toBeNull()
    expect(result?.status).toBe(403)
  })

  it('returns null when CF-IPCountry is GN (strict mode)', async () => {
    process.env.GEOBLOCK_POLICY = 'strict'
    const req = buildRequest('/api/auth/login', {
      'cf-connecting-ip': '41.82.156.10',
      'cf-ipcountry': 'GN',
    })
    const result = await checkGeoBlock(req)
    expect(result).toBeNull()
  })

  it('returns null when CF-IPCountry is a neighbor (lenient mode)', async () => {
    process.env.GEOBLOCK_POLICY = 'lenient'
    const req = buildRequest('/api/auth/login', {
      'cf-connecting-ip': '1.2.3.4',
      'cf-ipcountry': 'SN', // Senegal, in COUNTRY_NEIGHBORS
    })
    const result = await checkGeoBlock(req)
    expect(result).toBeNull()
  })

  it('returns 403 for high-risk country (RU)', async () => {
    process.env.GEOBLOCK_POLICY = 'lenient'
    const req = buildRequest('/api/auth/login', {
      'cf-connecting-ip': '5.6.7.8',
      'cf-ipcountry': 'RU',
    })
    const result = await checkGeoBlock(req)
    expect(result).not.toBeNull()
    expect(result?.status).toBe(403)
  })
})

describe('geoblock — country lists', () => {
  it('COUNTRY_NEIGHBORS includes all 9 expected countries', () => {
    expect(COUNTRY_NEIGHBORS).toHaveLength(9)
    expect(COUNTRY_NEIGHBORS).toContain('GN')
    expect(COUNTRY_NEIGHBORS).toContain('SN')
    expect(COUNTRY_NEIGHBORS).toContain('ML')
    expect(COUNTRY_NEIGHBORS).toContain('CI')
    expect(COUNTRY_NEIGHBORS).toContain('SL')
    expect(COUNTRY_NEIGHBORS).toContain('LR')
    expect(COUNTRY_NEIGHBORS).toContain('GW')
    expect(COUNTRY_NEIGHBORS).toContain('BF')
    expect(COUNTRY_NEIGHBORS).toContain('GH')
  })

  it('COUNTRY_DIASPORA includes France', () => {
    expect(COUNTRY_DIASPORA).toContain('FR')
    expect(COUNTRY_DIASPORA).toContain('US')
    expect(COUNTRY_DIASPORA).toContain('CA')
  })
})
