// ============================================================
// CodeRoute Guinée — Tests for dynamic rate limiter (Sprint 13)
// ============================================================
// Mocks the Redis client to test the adaptive rate-limit logic
// without requiring a live Redis instance.
// ============================================================

import { jest } from '@jest/globals'

// Mock the redis module before importing the SUT
const mockRedis: any = {
  getRedis: jest.fn(),
  isRedisAvailable: jest.fn(),
  slidingWindowIncrement: jest.fn(),
}

jest.mock('@/lib/redis', () => mockRedis)

// Mock ioredis (not installed in test env)
jest.mock('ioredis', () => {
  return class MockRedis {
    static default = jest.fn()
  }
})

// Mock maxmind (not installed in test env) — extract mock fn to avoid type inference issue
const mockMaxmindOpen = jest.fn() as any
mockMaxmindOpen.mockResolvedValue(null)
jest.mock('maxmind', () => ({
  open: mockMaxmindOpen,
}))

import { checkDynamicRateLimit, getCurrentMode, forceMode } from '@/lib/rate-limit-dynamic'
import { RATE_LIMIT_PRESETS } from '@/lib/rate-limit'

// Helper: build a fake NextRequest
function buildRequest(
  url: string,
  options: { ip?: string; userId?: string; method?: string } = {}
) {
  const headers = new Headers()
  if (options.ip) {
    headers.set('x-forwarded-for', options.ip)
  }
  if (options.userId) {
    headers.set('x-user-id', options.userId)
  }
  return {
    nextUrl: new URL(url, 'https://staging.coderoute.gov.gn'),
    headers,
    method: options.method || 'GET',
    cookies: { get: () => undefined },
  } as any
}

// Helper: cast jest.fn() to any to avoid TS never-inference issues
function fn(resolvedValue?: any): any {
  const f = jest.fn() as any
  if (resolvedValue !== undefined) {
    f.mockResolvedValue(resolvedValue)
  }
  return f
}

beforeEach(() => {
  jest.clearAllMocks()
  mockRedis.isRedisAvailable.mockReturnValue(false)
  mockRedis.getRedis.mockResolvedValue(null)
})

describe('rate-limit-dynamic — mode resolution', () => {
  it('returns normal mode when Redis is unavailable', async () => {
    const mode = await getCurrentMode()
    expect(mode).toBe('normal')
  })

  it('returns normal mode when Redis returns no 429 counter', async () => {
    mockRedis.isRedisAvailable.mockReturnValue(true)
    mockRedis.getRedis.mockResolvedValue({
      get: fn(null),
      set: fn(),
      del: fn(),
    })
    const mode = await getCurrentMode()
    expect(mode).toBe('normal')
  })

  it('returns elevated mode when 429 counter > 50', async () => {
    mockRedis.isRedisAvailable.mockReturnValue(true)
    mockRedis.getRedis.mockResolvedValue({
      get: fn('75'), // > ELEVATED_THRESHOLD
      set: fn(),
      del: fn(),
    })
    const mode = await getCurrentMode()
    expect(mode).toBe('elevated')
  })

  it('returns attack mode when attack flag is set', async () => {
    mockRedis.isRedisAvailable.mockReturnValue(true)
    mockRedis.getRedis.mockResolvedValue({
      get: fn('1'), // attack flag set
      set: fn(),
      del: fn(),
    })
    const mode = await getCurrentMode()
    expect(mode).toBe('attack')
  })
})

describe('rate-limit-dynamic — main check function', () => {
  it('returns null when Redis is unavailable (fail open)', async () => {
    const request = buildRequest('/api/auth/login', { ip: '41.82.156.10' })
    const result = await checkDynamicRateLimit(request, RATE_LIMIT_PRESETS.auth)
    expect(result).toBeNull()
  })

  it('returns null for first request in normal mode', async () => {
    mockRedis.isRedisAvailable.mockReturnValue(true)
    mockRedis.getRedis.mockResolvedValue({
      get: fn(null),
      hgetall: fn({}),
      set: fn(),
      del: fn(),
    })
    mockRedis.slidingWindowIncrement.mockResolvedValue(1) // first request

    const request = buildRequest('/api/auth/login', { ip: '41.82.156.10' })
    const result = await checkDynamicRateLimit(request, RATE_LIMIT_PRESETS.auth)
    expect(result).toBeNull()
  })

  it('returns 429 when count exceeds maxRequests in normal mode', async () => {
    mockRedis.isRedisAvailable.mockReturnValue(true)
    mockRedis.getRedis.mockResolvedValue({
      get: fn(null),
      hgetall: fn({}),
      set: fn(),
      del: fn(),
      pipeline: () => ({
        incr: fn(),
        expire: fn(),
        hincrby: fn(),
        hset: fn(),
        hdel: fn(),
        get: fn(),
        set: fn(),
        del: fn(),
        exec: fn([[null, 100]]),
      }),
    })
    mockRedis.slidingWindowIncrement.mockResolvedValue(100) // > maxRequests (10)

    const request = buildRequest('/api/auth/login', { ip: '41.82.156.10' })
    const result = await checkDynamicRateLimit(request, RATE_LIMIT_PRESETS.auth)
    expect(result).not.toBeNull()
    expect(result?.status).toBe(429)
  })

  it('returns 403 when IP is banned', async () => {
    mockRedis.isRedisAvailable.mockReturnValue(true)
    // Differentiate hgetall responses based on the key argument:
    // - rl:ban:ip → returns the banned IP
    // - rl:ban:user / rl:trusted:ip → returns empty
    const hgetallImpl = (key: string) => {
      if (key === 'rl:ban:ip') {
        return {
          '41.82.156.10': JSON.stringify({ reason: 'attack', ts: Date.now() }),
        }
      }
      return {}
    }
    const hgetallMock = jest.fn() as any
    hgetallMock.mockImplementation(hgetallImpl)
    mockRedis.getRedis.mockResolvedValue({
      get: fn(null),
      hgetall: hgetallMock,
    })

    const request = buildRequest('/api/auth/login', { ip: '41.82.156.10' })
    const result = await checkDynamicRateLimit(request, RATE_LIMIT_PRESETS.auth)
    expect(result).not.toBeNull()
    expect(result?.status).toBe(403)
  })

  it('checks user-level rate limit when userId is present', async () => {
    mockRedis.isRedisAvailable.mockReturnValue(true)
    mockRedis.getRedis.mockResolvedValue({
      get: fn(null),
      hgetall: fn({}),
      set: fn(),
      del: fn(),
    })
    // IP count = 1 (OK), user count = 100 (blocked)
    mockRedis.slidingWindowIncrement
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(100)

    const request = buildRequest('/api/bookings', {
      ip: '41.82.156.10',
      userId: 'user-123',
    })
    const result = await checkDynamicRateLimit(request, RATE_LIMIT_PRESETS.general)
    expect(result).not.toBeNull()
    expect(result?.status).toBe(429)
  })
})

describe('rate-limit-dynamic — admin operations', () => {
  it('forceMode normal clears attack flag', async () => {
    const mockDel = fn()
    mockRedis.getRedis.mockResolvedValue({ del: mockDel })

    await forceMode('normal')
    expect(mockDel).toHaveBeenCalledWith('rl:attack:active')
    expect(mockDel).toHaveBeenCalledWith('rl:429:5min')
  })

  it('forceMode attack sets attack flag with TTL', async () => {
    const mockSet = fn()
    mockRedis.getRedis.mockResolvedValue({ set: mockSet })

    await forceMode('attack')
    expect(mockSet).toHaveBeenCalledWith(
      'rl:attack:active',
      '1',
      'EX',
      7200
    )
  })

  it('throws when Redis unavailable', async () => {
    mockRedis.getRedis.mockResolvedValue(null)
    await expect(forceMode('attack')).rejects.toThrow('Redis unavailable')
  })
})
