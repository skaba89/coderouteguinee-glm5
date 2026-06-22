// ============================================================
// GET/POST /api/cron/notifications
// Trigger scheduled notification jobs.
//
// Auth strategies (one required):
//   1. CRON_SECRET env var + Authorization: Bearer <secret>
//   2. Logged-in super-admin session (for manual triggers from UI)
//
// Query params:
//   ?job=examReminder24h,examReminder2h   — run only specific jobs
//   ?dry=1                                  — log what would run, no actual send
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { runScheduledJobs } from '@/lib/scheduled-notifications'

export const dynamic = 'force-dynamic'

async function authorize(request: NextRequest): Promise<{ ok: true; via: 'bearer' | 'session' } | { ok: false; reason: string }> {
  // 1. Bearer token from CRON_SECRET env
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = request.headers.get('authorization') || ''
    const m = auth.match(/^Bearer\s+(.+)$/i)
    if (m && m[1] === cronSecret) {
      return { ok: true, via: 'bearer' }
    }
  }
  // 2. Super-admin session
  const session = await getSession()
  if (session && session.role === 'super-admin') {
    return { ok: true, via: 'session' }
  }
  return { ok: false, reason: 'Unauthorized' }
}

export async function GET(request: NextRequest) {
  return handle(request)
}

export async function POST(request: NextRequest) {
  return handle(request)
}

async function handle(request: NextRequest) {
  const auth = await authorize(request)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.reason }, { status: 401 })
  }

  const url = new URL(request.url)
  const jobFilter = url.searchParams.get('job')
    ? url.searchParams.get('job')!.split(',').map((s) => s.trim()).filter(Boolean)
    : undefined
  const dryRun = url.searchParams.get('dry') === '1'

  if (dryRun) {
    return NextResponse.json({
      dryRun: true,
      jobs: jobFilter || ['examReminder24h', 'examReminder2h', 'paymentPending7d', 'weeklyAdminDigest', 'inactiveUserNudge'],
      message: 'Dry-run mode — no notifications would be sent.',
    })
  }

  try {
    const summary = await runScheduledJobs(jobFilter)
    return NextResponse.json({
      ...summary,
      authorizedVia: auth.via,
    })
  } catch (e) {
    console.error('[/api/cron/notifications] error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Internal error' },
      { status: 500 },
    )
  }
}
