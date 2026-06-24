// ============================================================
// CodeRoute Guinée — Redis client (Sprint 13)
// Centralized Redis connection used by:
//   - rate-limit-dynamic.ts (adaptive rate limiting)
//   - geoblock.ts (geo-IP caching)
//   - fraud detection (real-time counters)
//   - session storage (optional, if enabled)
//
// Connection strategy:
//   1. Read REDIS_URL / REDIS_PASSWORD from env
//   2. Lazy-connect on first use (don't fail boot if Redis is down)
//   3. Auto-reconnect with exponential backoff
//   4. Emit 'error' events to prevent process crash
//   5. Expose `isRedisAvailable()` for graceful degradation
// ============================================================

import { env } from '@/lib/env'

type RedisClient = {
  ping(): Promise<string>
  incr(key: string): Promise<number>
  expire(key: string, ttlSeconds: number): Promise<number>
  ttl(key: string): Promise<number>
  get(key: string): Promise<string | null>
  set(
    key: string,
    value: string,
    mode?: 'EX' | 'NX' | 'PX',
    ttl?: number
  ): Promise<string | null>
  del(...keys: string[]): Promise<number>
  hgetall(key: string): Promise<Record<string, string>>
  hset(key: string, field: string, value: string): Promise<number>
  hdel(key: string, ...fields: string[]): Promise<number>
  hincrby(key: string, field: string, inc: number): Promise<number>
  pipeline(): {
    incr(key: string): ReturnType<RedisClient['pipeline']>
    expire(key: string, ttl: number): ReturnType<RedisClient['pipeline']>
    hincrby(key: string, field: string, inc: number): ReturnType<RedisClient['pipeline']>
    hset(key: string, field: string, value: string): ReturnType<RedisClient['pipeline']>
    hdel(key: string, field: string): ReturnType<RedisClient['pipeline']>
    get(key: string): ReturnType<RedisClient['pipeline']>
    set(key: string, value: string, mode?: string, ttl?: number): ReturnType<RedisClient['pipeline']>
    del(key: string): ReturnType<RedisClient['pipeline']>
    exec(): Promise<Array<[Error | null, unknown]>>
  }
  disconnect(): Promise<void>
  on(event: 'error', cb: (err: Error) => void): unknown
  on(event: 'connect' | 'ready' | 'reconnecting', cb: () => void): unknown
  status: string
}

let _client: RedisClient | null = null
let _connectionPromise: Promise<RedisClient | null> | null = null
let _lastError: Error | null = null
let _available = false

// ─── Build connection URL ─────────────────────────────────
function buildRedisUrl(): string {
  const explicit = process.env.REDIS_URL
  if (explicit) return explicit

  const host = process.env.REDIS_HOST || '127.0.0.1'
  const port = process.env.REDIS_PORT || '6379'
  const db = process.env.REDIS_DB || '0'
  return `redis://${host}:${port}/${db}`
}

// ─── Get or create Redis client ───────────────────────────
export async function getRedis(): Promise<RedisClient | null> {
  if (_client && _available) return _client
  if (_connectionPromise) return _connectionPromise

  _connectionPromise = (async () => {
    try {
      // Lazy-load ioredis to avoid breaking builds where the
      // package is not installed (e.g. unit tests on CI).
      const IORedis = (await import('ioredis')).default
      const url = buildRedisUrl()
      const password = process.env.REDIS_PASSWORD

      const client = new IORedis(url, {
        password: password || undefined,
        lazyConnect: false,
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        retryStrategy: (times: number) => {
          if (times > 10) {
            _available = false
            return null // stop retrying
          }
          return Math.min(times * 200, 5000)
        },
        reconnectOnError: (err: Error) => {
          const targetErrors = ['READONLY', 'ETIMEDOUT', 'ECONNRESET']
          return targetErrors.some(e => err.message.includes(e))
        },
      }) as unknown as RedisClient

      client.on('error', (err: Error) => {
        _lastError = err
        _available = false
        // Don't crash — log only. Fallback paths must handle null Redis.
        if (process.env.NODE_ENV !== 'test') {
          console.warn('[redis] error:', err.message)
        }
      })

      client.on('connect', () => {
        _available = true
        _lastError = null
      })

      client.on('reconnecting', () => {
        _available = false
      })

      // Verify connection
      await client.ping()
      _client = client
      _available = true
      return client
    } catch (err) {
      _lastError = err as Error
      _available = false
      if (process.env.NODE_ENV !== 'test') {
        console.warn(
          '[redis] unavailable, falling back to in-memory:',
          (err as Error).message
        )
      }
      return null
    } finally {
      _connectionPromise = null
    }
  })()

  return _connectionPromise
}

// ─── Synchronous availability check ───────────────────────
export function isRedisAvailable(): boolean {
  return _available && _client !== null
}

// ─── Last error (for diagnostics) ─────────────────────────
export function getRedisError(): Error | null {
  return _lastError
}

// ─── Force disconnect (used in tests / graceful shutdown) ─
export async function closeRedis(): Promise<void> {
  if (_client) {
    try {
      await _client.disconnect()
    } catch {
      /* ignore */
    }
    _client = null
    _available = false
  }
}

// ─── Helper: atomic sliding-window counter ────────────────
// Returns the count after incrementing. Uses Redis INCR + EXPIRE
// in a pipeline to keep it atomic.
export async function slidingWindowIncrement(
  key: string,
  windowSeconds: number
): Promise<number> {
  const redis = await getRedis()
  if (!redis) {
    // Fallback: return a benign large number to let caller decide
    return Number.MAX_SAFE_INTEGER
  }
  const pipeline = redis.pipeline()
  pipeline.incr(key)
  pipeline.expire(key, windowSeconds)
  const results = await pipeline.exec()
  if (!results || !results[0]) throw new Error('redis pipeline failed')
  const [err, count] = results[0]
  if (err) throw err
  return count as number
}

// ─── Helper: cached key/value with TTL ────────────────────
export async function cachedGet<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>
): Promise<T> {
  const redis = await getRedis()
  if (!redis) return loader()

  try {
    const cached = await redis.get(key)
    if (cached) return JSON.parse(cached) as T
  } catch {
    // fall through to loader
  }

  const fresh = await loader()
  try {
    await redis.set(key, JSON.stringify(fresh), 'EX', ttlSeconds)
  } catch {
    /* non-fatal */
  }
  return fresh
}
