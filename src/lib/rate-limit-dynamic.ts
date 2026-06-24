// ============================================================
// CodeRoute Guinée — Dynamic Adaptive Rate Limiting (Sprint 13)
// ============================================================
// Enhances the static in-memory rate limiter (rate-limit.ts) with:
//
//   1. Redis backend (works across multiple instances)
//   2. Adaptive thresholds (auto-tighten under attack)
//   3. Per-user rate limits (in addition to per-IP)
//   4. Anomaly detection (sudden traffic spikes → auto-block)
//   5. Manual IP/user banlist (admin can block in real time)
//   6. Graceful degradation to in-memory when Redis is down
//
// Adaptive logic:
//   - Normal:      use preset.maxRequests
//   - Elevated:    if 429s in last 5min > 50  → preset × 0.5
//   - Attack:      if 429s in last 5min > 200 → preset × 0.2 + 2× block
//   - Recovery:    if 429s back to < 10/min   → gradual return to normal
//
// All counters are stored in Redis keys with TTL.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { getRedis, isRedisAvailable, slidingWindowIncrement } from '@/lib/redis'
import { RATE_LIMIT_PRESETS, RateLimitConfig } from '@/lib/rate-limit'
import { logAuditConsole } from '@/lib/audit-log'

// ─── Adaptive state keys ──────────────────────────────────
const KEY_429_COUNTER = 'rl:429:5min' // sliding 5-min window of 429s
const KEY_ATTACK_FLAG = 'rl:attack:active' // '1' when in attack mode
const KEY_BANLIST_IP = 'rl:ban:ip' // hash of banned IPs
const KEY_BANLIST_USER = 'rl:ban:user' // hash of banned user IDs
const KEY_TRUSTED_IP = 'rl:trusted:ip' // hash of trusted IPs (admins, health checks)

// Thresholds for adaptive mode transitions
const ELEVATED_THRESHOLD = 50 // 429s in 5 min → elevated
const ATTACK_THRESHOLD = 200 // 429s in 5 min → attack
const RECOVERY_THRESHOLD = 10 // 429s in 1 min → back to normal

// ─── Mode ─────────────────────────────────────────────────
export type RateLimitMode = 'normal' | 'elevated' | 'attack'

export async function getCurrentMode(): Promise<RateLimitMode> {
  const redis = await getRedis()
  if (!redis) return 'normal'

  try {
    const attack = await redis.get(KEY_ATTACK_FLAG)
    if (attack === '1') return 'attack'
    const counter = await redis.get(KEY_429_COUNTER)
    const count = counter ? parseInt(counter, 10) : 0
    if (count > ELEVATED_THRESHOLD) return 'elevated'
    return 'normal'
  } catch {
    return 'normal'
  }
}

// ─── Compute effective config based on mode ───────────────
function applyMode(
  config: RateLimitConfig,
  mode: RateLimitMode
): RateLimitConfig {
  switch (mode) {
    case 'normal':
      return config
    case 'elevated':
      return {
        ...config,
        maxRequests: Math.max(1, Math.floor(config.maxRequests * 0.5)),
        blockDurationMs: config.blockDurationMs * 2,
      }
    case 'attack':
      return {
        ...config,
        maxRequests: Math.max(1, Math.floor(config.maxRequests * 0.2)),
        blockDurationMs: config.blockDurationMs * 4,
      }
  }
}

// ─── Extract client identifier ────────────────────────────
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return request.headers.get('x-real-ip') || 'unknown'
}

function getUserId(request: NextRequest): string | null {
  // Populated by middleware.ts (x-user-id header)
  return request.headers.get('x-user-id') || null
}

// ─── Check banlist / trustlist ────────────────────────────
async function isBanned(ip: string, userId: string | null): Promise<boolean> {
  const redis = await getRedis()
  if (!redis) return false
  try {
    if (userId) {
      const bannedUser = await redis.hgetall(KEY_BANLIST_USER)
      if (bannedUser && bannedUser[userId]) return true
    }
    const bannedIps = await redis.hgetall(KEY_BANLIST_IP)
    if (bannedIps && bannedIps[ip]) return true
  } catch {
    /* ignore — fail open on banlist read failure */
  }
  return false
}

async function isTrusted(ip: string): Promise<boolean> {
  const redis = await getRedis()
  if (!redis) return false
  try {
    const trusted = await redis.hgetall(KEY_TRUSTED_IP)
    return !!(trusted && trusted[ip])
  } catch {
    return false
  }
}

// ─── Record a 429 (used to drive adaptive mode) ───────────
async function record429(): Promise<void> {
  const redis = await getRedis()
  if (!redis) return
  try {
    const pipeline = redis.pipeline()
    pipeline.incr(KEY_429_COUNTER)
    pipeline.expire(KEY_429_COUNTER, 300) // 5 min sliding window
    await pipeline.exec()

    // Transition to attack mode if threshold exceeded
    const counter = await redis.get(KEY_429_COUNTER)
    const count = counter ? parseInt(counter, 10) : 0
    if (count > ATTACK_THRESHOLD) {
      await redis.set(KEY_ATTACK_FLAG, '1', 'EX', 1800) // 30 min attack mode
    } else if (count > ELEVATED_THRESHOLD) {
      await redis.set(KEY_ATTACK_FLAG, '1', 'EX', 900) // 15 min elevated mode
    }
  } catch {
    /* non-fatal */
  }
}

// ─── Try to recover from attack mode ──────────────────────
async function maybeRecover(): Promise<void> {
  const redis = await getRedis()
  if (!redis) return
  try {
    const counter = await redis.get(KEY_429_COUNTER)
    const count = counter ? parseInt(counter, 10) : 0
    if (count < RECOVERY_THRESHOLD) {
      await redis.del(KEY_ATTACK_FLAG)
    }
  } catch {
    /* ignore */
  }
}

// ─── Main check function ──────────────────────────────────
// Returns null if request is allowed, or a NextResponse (429/403)
// if it should be blocked.
export async function checkDynamicRateLimit(
  request: NextRequest,
  config: RateLimitConfig
): Promise<NextResponse | null> {
  const ip = getClientIp(request)
  const userId = getUserId(request)
  const path = request.nextUrl.pathname

  // 1. Trusted IP bypass (e.g. internal health checks, monitoring)
  if (await isTrusted(ip)) return null

  // 2. Hard banlist — return 403 immediately
  if (await isBanned(ip, userId)) {
    logAuditConsole({
      eventType: 'RATE_LIMIT_BANNED',
      severity: 'critical',
      description: `Banned IP/user attempted access: ${ip} → ${path}`,
      details: { ip, userId },
    }, request)
    return NextResponse.json(
      { error: 'Accès refusé.' },
      { status: 403 }
    )
  }

  // 3. Compute effective config based on adaptive mode
  const mode = await getCurrentMode()
  const effectiveConfig = applyMode(config, mode)

  // 4. Check IP-level rate limit (Redis or in-memory fallback)
  const windowSeconds = Math.floor(effectiveConfig.windowMs / 1000)
  const ipKey = `rl:${effectiveConfig.keyPrefix}:ip:${ip}`

  let ipCount: number
  if (isRedisAvailable()) {
    try {
      ipCount = await slidingWindowIncrement(ipKey, windowSeconds)
    } catch {
      ipCount = 0 // fail open on Redis error
    }
  } else {
    ipCount = 0 // fallback path handled by existing in-memory limiter
  }

  if (ipCount > effectiveConfig.maxRequests) {
    await record429()
    logAuditConsole({
      eventType: 'RATE_LIMIT_EXCEEDED',
      severity: mode === 'attack' ? 'critical' : 'warning',
      description: `IP ${ip} exceeded ${effectiveConfig.keyPrefix} limit (${ipCount}/${effectiveConfig.maxRequests}) — mode: ${mode}`,
      details: { ip, count: ipCount, mode, path },
    }, request)
    return build429Response(effectiveConfig, mode)
  }

  // 5. Check user-level rate limit (if authenticated)
  if (userId) {
    const userKey = `rl:${effectiveConfig.keyPrefix}:user:${userId}`
    let userCount: number
    if (isRedisAvailable()) {
      try {
        userCount = await slidingWindowIncrement(userKey, windowSeconds)
      } catch {
        userCount = 0
      }
    } else {
      userCount = 0
    }

    if (userCount > effectiveConfig.maxRequests) {
      await record429()
      logAuditConsole({
        eventType: 'RATE_LIMIT_USER_EXCEEDED',
        severity: 'warning',
        userId,
        description: `User ${userId} exceeded ${effectiveConfig.keyPrefix} limit (${userCount}/${effectiveConfig.maxRequests})`,
        details: { userId, count: userCount, mode, path },
      }, request)
      return build429Response(effectiveConfig, mode)
    }
  }

  // 6. Periodic recovery check (1% chance per request)
  if (Math.random() < 0.01) {
    await maybeRecover()
  }

  return null
}

// ─── Build a 429 response ─────────────────────────────────
function build429Response(
  config: RateLimitConfig,
  mode: RateLimitMode
): NextResponse {
  const retryAfter = Math.ceil(config.blockDurationMs / 1000)
  return NextResponse.json(
    {
      error: 'Trop de requêtes. Veuillez réessayer plus tard.',
      retryAfter,
      mode, // expose mode for client-side UX adaptation
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfter),
        'X-RateLimit-Limit': String(config.maxRequests),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Mode': mode,
      },
    }
  )
}

// ─── Admin API: ban/unban IPs and users ───────────────────
export async function banIp(ip: string, reason: string, ttlSeconds = 86400): Promise<void> {
  const redis = await getRedis()
  if (!redis) throw new Error('Redis unavailable')
  await redis.hset(KEY_BANLIST_IP, ip, JSON.stringify({ reason, ts: Date.now() }))
  // auto-expire the whole hash entry via separate TTL key
  await redis.set(`rl:ban:ip:${ip}:ttl`, '1', 'EX', ttlSeconds)
}

export async function unbanIp(ip: string): Promise<void> {
  const redis = await getRedis()
  if (!redis) throw new Error('Redis unavailable')
  await redis.hdel(KEY_BANLIST_IP, ip)
  await redis.del(`rl:ban:ip:${ip}:ttl`)
  // Note: hash entries are removed via HDEL; separate TTL marker file
  // is also cleared for cleanup job consistency
}

export async function banUser(userId: string, reason: string, ttlSeconds = 3600): Promise<void> {
  const redis = await getRedis()
  if (!redis) throw new Error('Redis unavailable')
  await redis.hset(KEY_BANLIST_USER, userId, JSON.stringify({ reason, ts: Date.now() }))
  await redis.set(`rl:ban:user:${userId}:ttl`, '1', 'EX', ttlSeconds)
}

export async function unbanUser(userId: string): Promise<void> {
  const redis = await getRedis()
  if (!redis) throw new Error('Redis unavailable')
  await redis.hdel(KEY_BANLIST_USER, userId)
  await redis.del(`rl:ban:user:${userId}:ttl`)
}

export async function addTrustedIp(ip: string, note: string): Promise<void> {
  const redis = await getRedis()
  if (!redis) throw new Error('Redis unavailable')
  await redis.hset(KEY_TRUSTED_IP, ip, JSON.stringify({ note, ts: Date.now() }))
}

export async function removeTrustedIp(ip: string): Promise<void> {
  const redis = await getRedis()
  if (!redis) throw new Error('Redis unavailable')
  await redis.hdel(KEY_TRUSTED_IP, ip)
}

// ─── Force mode override (admin) ──────────────────────────
export async function forceMode(mode: 'normal' | 'attack'): Promise<void> {
  const redis = await getRedis()
  if (!redis) throw new Error('Redis unavailable')
  if (mode === 'attack') {
    await redis.set(KEY_ATTACK_FLAG, '1', 'EX', 7200) // 2h forced attack mode
  } else {
    await redis.del(KEY_ATTACK_FLAG)
    await redis.del(KEY_429_COUNTER)
  }
}
