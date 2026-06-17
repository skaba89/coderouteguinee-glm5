// ============================================================
// CodeRoute Guinée — Rate Limiting
// In-memory sliding window rate limiter for API routes
// Prevents brute-force attacks and API abuse
// ============================================================

import { NextRequest, NextResponse } from 'next/server'

interface RateLimitEntry {
  count: number
  windowStart: number
  blocked: boolean
  blockedUntil: number
}

// ─── Configuration per route category ──────────────────────
export interface RateLimitConfig {
  windowMs: number      // Time window in milliseconds
  maxRequests: number   // Max requests per window
  blockDurationMs: number // How long to block after exceeding
  keyPrefix: string     // Prefix for logging/identification
}

// Preset configurations
export const RATE_LIMIT_PRESETS = {
  // Authentication routes: strict — prevent brute-force
  auth: {
    windowMs: 15 * 60 * 1000,     // 15 minutes
    maxRequests: 10,                // 10 attempts per 15 min
    blockDurationMs: 30 * 60 * 1000, // Block for 30 min
    keyPrefix: 'auth',
  },
  // Payment routes: moderate
  payment: {
    windowMs: 10 * 60 * 1000,     // 10 minutes
    maxRequests: 20,               // 20 requests per 10 min
    blockDurationMs: 15 * 60 * 1000,
    keyPrefix: 'payment',
  },
  // Admin routes: moderate
  admin: {
    windowMs: 5 * 60 * 1000,      // 5 minutes
    maxRequests: 100,              // 100 requests per 5 min
    blockDurationMs: 10 * 60 * 1000,
    keyPrefix: 'admin',
  },
  // General API: permissive
  general: {
    windowMs: 1 * 60 * 1000,      // 1 minute
    maxRequests: 60,               // 60 requests per min
    blockDurationMs: 5 * 60 * 1000,
    keyPrefix: 'general',
  },
  // Password reset: very strict
  passwordReset: {
    windowMs: 60 * 60 * 1000,     // 1 hour
    maxRequests: 5,                // 5 attempts per hour
    blockDurationMs: 60 * 60 * 1000,
    keyPrefix: 'pwd-reset',
  },
} as const

// ─── In-memory store ───────────────────────────────────────
// Note: In production with multiple instances, use Redis
const store = new Map<string, RateLimitEntry>()

// Cleanup old entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000
let lastCleanup = Date.now()

function cleanupStore(): void {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now

  for (const [key, entry] of store.entries()) {
    if (entry.blocked && now > entry.blockedUntil) {
      store.delete(key)
    } else if (!entry.blocked && now - entry.windowStart > entry.windowMs * 2) {
      store.delete(key)
    }
  }
}

// ─── Get client identifier ─────────────────────────────────
function getClientId(request: NextRequest): string {
  // Use X-Forwarded-For if behind a proxy, otherwise fall back to IP
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  // Next.js may not expose remote address in middleware easily
  return request.headers.get('x-real-ip') || 'unknown'
}

// ─── Check rate limit ──────────────────────────────────────
export function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig
): NextResponse | null {
  cleanupStore()

  const clientId = getClientId(request)
  const key = `${config.keyPrefix}:${clientId}`
  const now = Date.now()

  const entry = store.get(key)

  // If currently blocked
  if (entry?.blocked && now < entry.blockedUntil) {
    const retryAfter = Math.ceil((entry.blockedUntil - now) / 1000)
    return NextResponse.json(
      {
        error: 'Trop de requêtes. Veuillez réessayer plus tard.',
        retryAfter,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(config.maxRequests),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(entry.blockedUntil / 1000)),
        },
      }
    )
  }

  // If blocked period has expired, reset
  if (entry?.blocked && now >= entry.blockedUntil) {
    store.delete(key)
  }

  // If window has expired, reset
  if (entry && !entry.blocked && now - entry.windowStart > config.windowMs) {
    store.delete(key)
  }

  // Get or create entry
  const current = store.get(key) || { count: 0, windowStart: now, blocked: false, blockedUntil: 0 }
  current.count += 1

  if (current.count === 1) {
    current.windowStart = now
  }

  // Check if limit exceeded
  if (current.count > config.maxRequests) {
    current.blocked = true
    current.blockedUntil = now + config.blockDurationMs
    store.set(key, current)

    return NextResponse.json(
      {
        error: 'Trop de requêtes. Veuillez réessayer plus tard.',
        retryAfter: Math.ceil(config.blockDurationMs / 1000),
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil(config.blockDurationMs / 1000)),
          'X-RateLimit-Limit': String(config.maxRequests),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(current.blockedUntil / 1000)),
        },
      }
    )
  }

  store.set(key, current)

  // Not rate limited — return null to continue
  return null
}

// ─── Get remaining requests for response headers ───────────
export function getRateLimitHeaders(
  request: NextRequest,
  config: RateLimitConfig
): Record<string, string> {
  const clientId = getClientId(request)
  const key = `${config.keyPrefix}:${clientId}`
  const entry = store.get(key)

  const remaining = entry
    ? Math.max(0, config.maxRequests - entry.count)
    : config.maxRequests

  return {
    'X-RateLimit-Limit': String(config.maxRequests),
    'X-RateLimit-Remaining': String(remaining),
  }
}
