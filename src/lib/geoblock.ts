// ============================================================
// CodeRoute Guinée — Geo-IP Filtering (Sprint 13)
// ============================================================
// Blocks/flags requests from outside the allowed country list.
//
// Default policy (strict): only Guinea (GN) is allowed.
// Expanded policy (lenient): GN + 8 neighbouring countries
//   (Senegal SN, Mali ML, Côte d'Ivoire CI, Sierra Leone SL,
//    Liberia LR, Guinea-Bissau GW, Burkina Faso BF, Ghana GH)
// Diaspora policy: above + France (FR), Belgium (BE), USA (US),
//   Canada (CA), Germany (DE), UK (GB), UAE (AE), Senegal (SN)
//
// Implementation:
//   1. Read X-Forwarded-For / CF-Connecting-IP / X-Real-IP
//   2. Look up country via MaxMind GeoLite2 (local DB, no API call)
//      OR via Cloudflare's CF-IPCountry header (if behind CF)
//   3. Cache result in Redis (24h TTL)
//   4. If blocked: return 403 + audit log + optionally Sentry alert
//
// Bypass mechanism:
//   - Admin IPs in allowlist (env GEOBLOCK_ALLOWLIST_CIDR)
//   - Valid session token with role administration/super-admin
//
// Fail-open vs fail-closed:
//   - If MaxMind DB missing AND no CF-IPCountry → fail OPEN
//     (don't break service if geo lookup infra is down)
//   - If country detected and not in allowlist → fail CLOSED (403)
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { getRedis, isRedisAvailable, cachedGet } from '@/lib/redis'
import { logAuditConsole } from '@/lib/audit-log'

// ─── Country allowlists ───────────────────────────────────
export const COUNTRY_GN_ONLY = ['GN'] as const
export const COUNTRY_NEIGHBORS = [
  'GN', 'SN', 'ML', 'CI', 'SL', 'LR', 'GW', 'BF', 'GH',
] as const
export const COUNTRY_DIASPORA = [
  'GN', 'SN', 'ML', 'CI', 'SL', 'LR', 'GW', 'BF', 'GH',
  'FR', 'BE', 'US', 'CA', 'DE', 'GB', 'AE',
] as const

export type GeoPolicy = 'strict' | 'lenient' | 'diaspora' | 'disabled'

function getAllowedCountries(policy: GeoPolicy): readonly string[] {
  switch (policy) {
    case 'strict': return COUNTRY_GN_ONLY
    case 'lenient': return COUNTRY_NEIGHBORS
    case 'diaspora': return COUNTRY_DIASPORA
    case 'disabled': return [] // means: skip check
  }
}

// ─── Policy resolution ────────────────────────────────────
export function resolveGeoPolicy(): GeoPolicy {
  const raw = (process.env.GEOBLOCK_POLICY || 'lenient').toLowerCase()
  if (raw === 'strict' || raw === 'lenient' || raw === 'diaspora' || raw === 'disabled') {
    return raw
  }
  return 'lenient'
}

// ─── IP extraction (handles proxies) ──────────────────────
export function getClientIp(request: NextRequest): string {
  // Cloudflare
  const cfIp = request.headers.get('cf-connecting-ip')
  if (cfIp) return cfIp

  // Standard X-Forwarded-For
  const xff = request.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()

  // Nginx
  return request.headers.get('x-real-ip') || '127.0.0.1'
}

// ─── Country lookup (Cloudflare first, then MaxMind) ──────
async function lookupCountry(ip: string, request: NextRequest): Promise<string | null> {
  // 1. Cloudflare provides CF-IPCountry header (fastest)
  const cfCountry = request.headers.get('cf-ipcountry')
  if (cfCountry && cfCountry.length === 2) {
    return cfCountry.toUpperCase()
  }

  // 2. Cache hit in Redis?
  const cacheKey = `geo:ip:${ip}`
  if (isRedisAvailable()) {
    try {
      const cached = await cachedGet<string | null>(cacheKey, 86400, async () => {
        return await maxmindLookup(ip)
      })
      return cached
    } catch {
      /* fall through to direct lookup */
    }
  }

  // 3. Direct MaxMind lookup
  return maxmindLookup(ip)
}

// ─── MaxMind GeoLite2 lookup (lazy-loaded) ────────────────
type MaxMindReader = {
  country?: (ip: string) => { country?: { isoCode?: string } } | null
} | null

let _maxmindReader: MaxMindReader = null
let _maxmindLoadAttempted = false

async function maxmindLookup(ip: string): Promise<string | null> {
  // Skip private/loopback IPs
  if (ip.startsWith('127.') || ip.startsWith('10.') ||
      ip.startsWith('192.168.') || ip.startsWith('172.16.') ||
      ip === '::1' || ip === 'unknown') {
    return null
  }

  if (!_maxmindLoadAttempted) {
    _maxmindLoadAttempted = true
    try {
      const dbPath = process.env.MAXMIND_DB_PATH || '/data/GeoLite2-Country.mmdb'
      const maxmind = await import('maxmind')
      _maxmindReader = (await maxmind.open(dbPath)) as MaxMindReader
    } catch (err) {
      if (process.env.NODE_ENV !== 'test') {
        console.warn(
          '[geoblock] MaxMind DB not loaded — failing OPEN for country lookups:',
          (err as Error).message
        )
      }
      _maxmindReader = null
    }
  }

  if (!_maxmindReader?.country) return null

  try {
    const result = _maxmindReader.country(ip)
    return result?.country?.isoCode?.toUpperCase() || null
  } catch {
    return null
  }
}

// ─── Allowlist CIDR check (admin networks bypass) ─────────
function isAllowlisted(ip: string): boolean {
  const allowlist = process.env.GEOBLOCK_ALLOWLIST_CIDR
  if (!allowlist) return false

  // Simple CIDR matching — for production use a proper CIDR lib
  const cidrs = allowlist.split(',').map(c => c.trim()).filter(Boolean)
  for (const cidr of cidrs) {
    if (matchCidr(ip, cidr)) return true
  }
  return false
}

function matchCidr(ip: string, cidr: string): boolean {
  // Handle exact IP match (most common case for admin IPs)
  if (!cidr.includes('/')) return ip === cidr

  const [base, prefixStr] = cidr.split('/')
  const prefix = parseInt(prefixStr, 10)
  if (isNaN(prefix)) return false

  // IPv4 only — IPv6 CIDR matching would require a proper lib
  const ipParts = ip.split('.').map(Number)
  const baseParts = base.split('.').map(Number)
  if (ipParts.length !== 4 || baseParts.length !== 4) return false

  const ipNum = (ipParts[0] << 24) | (ipParts[1] << 16) | (ipParts[2] << 8) | ipParts[3]
  const baseNum = (baseParts[0] << 24) | (baseParts[1] << 16) | (baseParts[2] << 8) | baseParts[3]
  const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0

  return (ipNum & mask) === (baseNum & mask)
}

// ─── Main middleware function ─────────────────────────────
// Returns null if request is allowed, or a 403 NextResponse if blocked.
export async function checkGeoBlock(
  request: NextRequest
): Promise<NextResponse | null> {
  const policy = resolveGeoPolicy()
  if (policy === 'disabled') return null

  const ip = getClientIp(request)

  // Always allow allowlisted CIDRs
  if (isAllowlisted(ip)) return null

  const allowedCountries = getAllowedCountries(policy)
  const country = await lookupCountry(ip, request)

  // Fail open if country cannot be determined (infra issue)
  if (!country) {
    if (process.env.GEOBLOCK_FAIL_CLOSED === 'true') {
      logAuditConsole({
        eventType: 'GEOBLOCK_FAIL_CLOSED',
        severity: 'warning',
        description: `Request blocked — country unknown for IP ${ip}`,
        details: { ip, policy },
      }, request)
      return NextResponse.json(
        { error: 'Accès non autorisé depuis votre localisation.' },
        { status: 403 }
      )
    }
    return null
  }

  if (!allowedCountries.includes(country)) {
    logAuditConsole({
      eventType: 'GEOBLOCK_BLOCKED',
      severity: 'warning',
      description: `Blocked request from ${country} (IP ${ip}) — policy: ${policy}`,
      details: { ip, country, policy, path: request.nextUrl.pathname },
    }, request)

    // Optional: trigger Sentry alert for unexpected countries
    // (e.g. requests from Russia, China, North Korea)
    const highRiskCountries = ['RU', 'CN', 'KP', 'IR', 'SY']
    if (highRiskCountries.includes(country)) {
      logAuditConsole({
        eventType: 'GEOBLOCK_HIGH_RISK',
        severity: 'critical',
        description: `Blocked request from HIGH-RISK country ${country} (IP ${ip})`,
        details: { ip, country, path: request.nextUrl.pathname },
      }, request)
    }

    return NextResponse.json(
      {
        error: 'CodeRoute Guinée n\'est pas accessible depuis votre pays.',
        country,
        support: 'support@coderoute.gov.gn',
      },
      { status: 403 }
    )
  }

  return null
}

// ─── Stats endpoint helper ────────────────────────────────
export async function getGeoStats(): Promise<{
  policy: GeoPolicy
  allowedCountries: readonly string[]
  redisAvailable: boolean
}> {
  return {
    policy: resolveGeoPolicy(),
    allowedCountries: getAllowedCountries(resolveGeoPolicy()),
    redisAvailable: isRedisAvailable(),
  }
}
