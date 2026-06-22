// ============================================================
// CodeRoute Guinée — Sentry wrapper (Sprint 2)
// ============================================================
// Lightweight Sentry integration that gracefully degrades to
// no-op when SENTRY_DSN is not set. This means:
//   - In dev / staging without Sentry: zero overhead, no errors
//   - In prod with Sentry: full error + performance monitoring
//
// We use this wrapper instead of @sentry/nextjs directly so
// that:
//   1. We don't need to install @sentry/nextjs in dev
//   2. We can swap Sentry for another provider (Datadog, etc.)
//      without touching call sites
//   3. Tests can mock this module trivially
//
// To enable Sentry in production:
//   1. npm install @sentry/nextjs
//   2. Set SENTRY_DSN env var
//   3. (Optional) Set SENTRY_ENVIRONMENT, SENTRY_TRACES_SAMPLE_RATE
//   4. The Sentry SDK will auto-initialize via next.config.ts wrapper
// ============================================================

export interface SentryContext {
  user?: { id: string; email?: string; role?: string }
  tags?: Record<string, string>
  extra?: Record<string, unknown>
}

/**
 * Returns true if Sentry is configured (SENTRY_DSN env var is set).
 * Use this to gate Sentry-specific code paths.
 */
export function isSentryConfigured(): boolean {
  return !!process.env.SENTRY_DSN && process.env.SENTRY_DSN.startsWith('https://')
}

/**
 * Capture an exception in Sentry.
 * No-op if Sentry is not configured.
 *
 * Usage:
 *   import { captureException } from '@/lib/sentry'
 *   try { ... } catch (err) {
 *     captureException(err, { user: { id: userId }, tags: { feature: 'payment' } })
 *     throw err  // or handle
 *   }
 */
export function captureException(
  error: unknown,
  context?: SentryContext,
): void {
  if (!isSentryConfigured()) {
    // Console fallback in dev so errors aren't completely silent
    if (process.env.NODE_ENV !== 'production') {
      console.error('[SENTRY (not configured) would capture]', error, context)
    }
    return
  }

  // Dynamic import so we don't crash if @sentry/nextjs isn't installed
  // (it's optional — see header docs)
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-explicit-any
    const Sentry = require('@sentry/nextjs') as any
    if (context?.user) {
      Sentry.setUser(context.user)
    }
    if (context?.tags) {
      for (const [key, value] of Object.entries(context.tags)) {
        Sentry.setTag(key, value)
      }
    }
    if (context?.extra) {
      for (const [key, value] of Object.entries(context.extra)) {
        Sentry.setExtra(key, value)
      }
    }
    Sentry.captureException(error)
  } catch (importErr) {
    // @sentry/nextjs not installed — log warning once, then no-op
    console.warn(
      '[SENTRY] SENTRY_DSN is set but @sentry/nextjs is not installed. ' +
        'Run: npm install @sentry/nextjs',
    )
    console.error('[SENTRY fallback]', error)
  }
}

/**
 * Capture a message (info-level event) in Sentry.
 * Use for significant business events (payment confirmed, user registered, etc.)
 */
export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context?: SentryContext,
): void {
  if (!isSentryConfigured()) return

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-explicit-any
    const Sentry = require('@sentry/nextjs') as any
    if (context?.user) Sentry.setUser(context.user)
    if (context?.tags) {
      for (const [key, value] of Object.entries(context.tags)) {
        Sentry.setTag(key, value)
      }
    }
    Sentry.captureMessage(message, level)
  } catch {
    // No-op (not installed)
  }
}

/**
 * Start a Sentry performance transaction.
 * Returns a span that you call .finish() on when done.
 * No-op if Sentry is not configured.
 *
 * Usage:
 *   const span = startSpan('payment.initiate', 'orange_money')
 *   try { ... } finally { span.finish() }
 */
export function startSpan(
  name: string,
  op?: string,
): { finish: () => void } {
  if (!isSentryConfigured()) {
    return { finish: () => {} }
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-explicit-any
    const Sentry = require('@sentry/nextjs') as any
    const transaction = Sentry.startTransaction({ name, op })
    return {
      finish: () => transaction.finish(),
    }
  } catch {
    return { finish: () => {} }
  }
}
