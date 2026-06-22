// ============================================================
// CodeRoute Guinée — Health Check Endpoint
// Public (no auth) — used by monitoring tools and the admin UI
// Returns DB, env, and uptime status.
//
// Query params:
//   ?quick=true  — skip DB check, just return 200 if process is alive.
//                  Use this for k8s liveness probes (cheap, frequent).
//   ?deep=true   — also check env vars + secrets (default behavior).
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Start time used for uptime calculation
const START_TIME = Date.now()

interface CheckResult {
  name: string
  status: 'ok' | 'error'
  latencyMs?: number
  message?: string
}

export async function GET(request?: NextRequest) {
  // ─── Quick mode: just return 200 (k8s liveness probe) ──
  const quick = request?.nextUrl.searchParams.get('quick') === 'true'
  if (quick) {
    return NextResponse.json({
      status: 'alive',
      uptime: Date.now() - START_TIME,
      timestamp: new Date().toISOString(),
    })
  }

  const checks: CheckResult[] = []

  // ─── Database check ────────────────────────────────────
  const dbStart = Date.now()
  try {
    await db.$queryRaw`SELECT 1`
    checks.push({
      name: 'database',
      status: 'ok',
      latencyMs: Date.now() - dbStart,
    })
  } catch (err) {
    checks.push({
      name: 'database',
      status: 'error',
      latencyMs: Date.now() - dbStart,
      message: err instanceof Error ? err.message : 'Database unreachable',
    })
  }

  // ─── App / runtime check ───────────────────────────────
  checks.push({
    name: 'app',
    status: 'ok',
  })

  // ─── Environment check ─────────────────────────────────
  const missingEnv: string[] = []
  if (!process.env.DATABASE_URL) missingEnv.push('DATABASE_URL')
  if (!process.env.SESSION_SECRET) missingEnv.push('SESSION_SECRET')
  if (!process.env.CSRF_SECRET) missingEnv.push('CSRF_SECRET')

  checks.push({
    name: 'environment',
    status: missingEnv.length === 0 ? 'ok' : 'error',
    message:
      missingEnv.length === 0
        ? undefined
        : `Missing env vars: ${missingEnv.join(', ')}`,
  })

  // ─── Session secret check ──────────────────────────────
  const sessionSecret = process.env.SESSION_SECRET
  const isDefaultSecret =
    !sessionSecret ||
    sessionSecret === 'coderoute-guinee-session-secret-2024-change-in-production'
  checks.push({
    name: 'sessionSecret',
    status: isDefaultSecret ? 'error' : 'ok',
    message: isDefaultSecret
      ? 'SESSION_SECRET is using default value — change it for production'
      : undefined,
  })

  // ─── Aggregate ─────────────────────────────────────────
  const allOk = checks.every((c) => c.status === 'ok')
  const uptimeMs = Date.now() - START_TIME

  return NextResponse.json(
    {
      status: allOk ? 'healthy' : 'degraded',
      uptime: uptimeMs,
      uptimeFormatted: formatUptime(uptimeMs),
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.2.0',
      checks,
    },
    { status: allOk ? 200 : 503 }
  )
}

// ─── Format uptime as "Xj Xh Xm Xs" ──────────────────────
function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  const parts: string[] = []
  if (days > 0) parts.push(`${days}j`)
  if (hours > 0 || days > 0) parts.push(`${hours}h`)
  if (minutes > 0 || hours > 0 || days > 0) parts.push(`${minutes}m`)
  parts.push(`${secs}s`)
  return parts.join(' ')
}
