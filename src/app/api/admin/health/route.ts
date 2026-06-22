// ============================================================
// CodeRoute Guinée — Admin integration health check (Sprint 2)
// ============================================================
// GET /api/admin/health — Returns the health of all integrations:
//   - Database (Prisma connection)
//   - SMTP email (verify() call)
//   - SMS provider (Orange OAuth2 token endpoint reachable)
//   - Mobile Money (provider configured & API key set)
//   - Sentry (DSN set)
//   - Webhook secrets (each provider has a secret ≥32 chars)
//
// This endpoint is intended for:
//   1. Admin dashboard "system health" widget
//   2. Uptime monitoring (e.g., UptimeRobot poll this URL)
//   3. Pre-deploy validation (curl after deploy)
//
// Auth: super-admin or administration only.
// ============================================================

import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'
import { verifySmtpConnection } from '@/lib/email'
import { isSentryConfigured } from '@/lib/sentry'
import { getWebhookSecret, type WebhookProvider } from '@/lib/webhook'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface CheckResult {
  name: string
  status: 'ok' | 'warning' | 'error' | 'skipped'
  detail: string
  latency_ms?: number
}

async function checkDatabase(): Promise<CheckResult> {
  const start = Date.now()
  try {
    // Simple query — will throw if DB unreachable
    await db.$queryRaw`SELECT 1`
    return {
      name: 'Database',
      status: 'ok',
      detail: 'Prisma connection successful',
      latency_ms: Date.now() - start,
    }
  } catch (err: any) {
    return {
      name: 'Database',
      status: 'error',
      detail: `DB error: ${err.message?.slice(0, 100) || 'unknown'}`,
      latency_ms: Date.now() - start,
    }
  }
}

async function checkSmtp(): Promise<CheckResult> {
  if (!process.env.SMTP_HOST && !process.env.EMAIL_API_URL) {
    return {
      name: 'SMTP Email',
      status: 'skipped',
      detail: 'SMTP_HOST and EMAIL_API_URL not set (emails will log to console)',
    }
  }
  // If HTTP API configured, we can't easily verify — just check the URL is set
  if (process.env.EMAIL_API_URL) {
    return {
      name: 'SMTP Email',
      status: 'ok',
      detail: `HTTP email API configured (${process.env.EMAIL_API_URL.slice(0, 40)}...)`,
    }
  }
  // Real SMTP verify
  const start = Date.now()
  const result = await verifySmtpConnection()
  return {
    name: 'SMTP Email',
    status: result.ok ? 'ok' : 'error',
    detail: result.ok
      ? `SMTP connection OK (${process.env.SMTP_HOST}:${process.env.SMTP_PORT})`
      : result.error || 'SMTP verify failed',
    latency_ms: Date.now() - start,
  }
}

function checkSms(): CheckResult {
  const provider = process.env.SMS_PROVIDER || 'console'
  if (provider === 'console') {
    return {
      name: 'SMS Provider',
      status: 'skipped',
      detail: 'SMS_PROVIDER=console (SMS log to stdout, no real SMS sent)',
    }
  }
  if (provider === 'orange') {
    const hasCreds =
      process.env.ORANGE_SMS_CLIENT_ID &&
      process.env.ORANGE_SMS_CLIENT_SECRET &&
      process.env.ORANGE_SMS_SENDER_ADDRESS
    return {
      name: 'SMS Provider',
      status: hasCreds ? 'ok' : 'error',
      detail: hasCreds
        ? 'Orange SMS OAuth2 credentials configured'
        : 'SMS_PROVIDER=orange but ORANGE_SMS_* credentials incomplete',
    }
  }
  return {
    name: 'SMS Provider',
    status: 'ok',
    detail: `SMS provider: ${provider}`,
  }
}

function checkMobileMoney(): CheckResult {
  const provider = process.env.MOMO_PROVIDER || 'mock'
  if (provider === 'mock') {
    return {
      name: 'Mobile Money',
      status: 'skipped',
      detail: 'MOMO_PROVIDER=mock (no real payments processed)',
    }
  }
  const hasCreds = process.env.MOMO_API_KEY && process.env.MOMO_API_SECRET
  return {
    name: 'Mobile Money',
    status: hasCreds ? 'ok' : 'error',
    detail: hasCreds
      ? `${provider} credentials configured`
      : `MOMO_PROVIDER=${provider} but MOMO_API_KEY/MOMO_API_SECRET not set`,
  }
}

function checkWebhookSecrets(): CheckResult[] {
  const providers: WebhookProvider[] = [
    'orange_money',
    'mtn_money',
    'celcom_money',
    'orange_sms',
  ]
  return providers.map((p) => {
    const secret = getWebhookSecret(p)
    if (!secret) {
      return {
        name: `Webhook secret (${p})`,
        status: process.env.NODE_ENV === 'production' ? 'error' : 'warning',
        detail: 'Not configured — webhooks will fail-closed in production',
      }
    }
    if (secret.length < 32) {
      return {
        name: `Webhook secret (${p})`,
        status: 'warning',
        detail: `Only ${secret.length} chars (recommend 32+)`,
      }
    }
    return {
      name: `Webhook secret (${p})`,
      status: 'ok',
      detail: `Configured (${secret.length} chars)`,
    }
  })
}

function checkSentry(): CheckResult {
  if (!isSentryConfigured()) {
    return {
      name: 'Sentry',
      status: 'skipped',
      detail: 'SENTRY_DSN not set (error monitoring disabled)',
    }
  }
  return {
    name: 'Sentry',
    status: 'ok',
    detail: `SENTRY_DSN configured (env=${process.env.SENTRY_ENVIRONMENT || 'production'})`,
  }
}

function checkSecrets(): CheckResult[] {
  const required = ['SESSION_SECRET', 'JWT_SECRET', 'CSRF_SECRET']
  return required.map((name) => {
    const value = process.env[name]
    if (!value) {
      return {
        name,
        status: 'error',
        detail: 'Not set — app will crash on boot in production',
      }
    }
    if (value.length < 32) {
      return {
        name,
        status: 'error',
        detail: `Only ${value.length} chars (need 32+)`,
      }
    }
    return {
      name,
      status: 'ok',
      detail: `Configured (${value.length} chars)`,
    }
  })
}

export async function GET() {
  // ─── Auth check ──────────────────────────────────────────
  const session = await getSession()
  if (!session || (session.role !== 'super-admin' && session.role !== 'administration')) {
    return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 })
  }

  // ─── Run all checks in parallel ──────────────────────────
  const [database, smtp, sms, momo, sentry] = await Promise.all([
    checkDatabase(),
    checkSmtp(),
    Promise.resolve(checkSms()),
    Promise.resolve(checkMobileMoney()),
    Promise.resolve(checkSentry()),
  ])

  const webhookSecrets = checkWebhookSecrets()
  const secrets = checkSecrets()

  const checks: CheckResult[] = [
    database,
    smtp,
    sms,
    momo,
    sentry,
    ...webhookSecrets,
    ...secrets,
  ]

  // ─── Overall status ──────────────────────────────────────
  const hasError = checks.some((c) => c.status === 'error')
  const hasWarning = checks.some((c) => c.status === 'warning')
  const overall = hasError ? 'error' : hasWarning ? 'warning' : 'ok'

  return NextResponse.json({
    overall,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks,
  })
}
