// ============================================================
// CodeRoute Guinée — Webhook signature verification (Sprint 2)
// ============================================================
// Centralized HMAC-SHA256 signature verification for all incoming
// webhooks (Orange Money, MTN MoMo, Celcom Money, Orange SMS DLRs).
//
// Security principles:
//   1. NEVER accept unsigned webhooks in production
//   2. Use timing-safe comparison to prevent timing attacks
//   3. Each provider has its own secret (compromise of one
//      provider's secret does not affect others)
//   4. Secrets must be at least 32 chars
// ============================================================

import { createHmac, timingSafeEqual } from 'crypto'

export type WebhookProvider =
  | 'orange_money'
  | 'mtn_money'
  | 'celcom_money'
  | 'orange_sms'
  | 'generic'

/**
 * Mapping from provider id to env var name holding the webhook secret.
 * Add new providers here when they are integrated.
 */
const PROVIDER_SECRET_ENV: Record<WebhookProvider, string> = {
  orange_money: 'ORANGE_MONEY_WEBHOOK_SECRET',
  mtn_money: 'MTN_MONEY_WEBHOOK_SECRET',
  celcom_money: 'CELCOM_MONEY_WEBHOOK_SECRET',
  orange_sms: 'ORANGE_SMS_WEBHOOK_SECRET',
  generic: 'WEBHOOK_SECRET',
}

const MIN_SECRET_LENGTH = 32

export interface VerificationResult {
  ok: boolean
  reason?: 'no_secret' | 'invalid_signature' | 'weak_secret' | 'missing_signature'
  provider: WebhookProvider
}

/**
 * Get the configured secret for a provider.
 * Returns null if not set.
 */
export function getWebhookSecret(provider: WebhookProvider): string | null {
  const envVar = PROVIDER_SECRET_ENV[provider]
  const value = process.env[envVar]
  if (!value) return null
  return value
}

/**
 * Verify a webhook signature.
 *
 * @param provider  Provider id (determines which secret to use)
 * @param rawBody   The raw request body as received (NOT re-serialized JSON)
 * @param signature The signature from the webhook header
 * @returns VerificationResult
 *
 * In production: returns ok=false if no secret is configured (fail-closed).
 * In development: returns ok=true if no secret is configured (fail-open,
 *   so devs can test without setting up webhook secrets).
 */
export function verifyWebhookSignature(
  provider: WebhookProvider,
  rawBody: string,
  signature: string | null,
): VerificationResult {
  // ─── Step 1: signature must be present ──────────────────
  if (!signature || signature.length === 0) {
    return { ok: false, reason: 'missing_signature', provider }
  }

  // ─── Step 2: load secret ────────────────────────────────
  const secret = getWebhookSecret(provider)

  if (!secret) {
    // Fail-closed in production, fail-open in dev
    if (process.env.NODE_ENV === 'production') {
      return { ok: false, reason: 'no_secret', provider }
    }
    // Dev mode: accept (with warning logged by caller)
    return { ok: true, provider }
  }

  // ─── Step 3: enforce minimum secret length ──────────────
  if (secret.length < MIN_SECRET_LENGTH) {
    if (process.env.NODE_ENV === 'production') {
      return { ok: false, reason: 'weak_secret', provider }
    }
    console.warn(
      `⚠ Webhook secret for ${provider} is only ${secret.length} chars ` +
      `(recommend ${MIN_SECRET_LENGTH}+). Generate with: openssl rand -hex 32`,
    )
  }

  // ─── Step 4: compute expected signature ─────────────────
  // Support multiple signature header formats:
  //   "sha256=<hex>"  (GitHub-style)
  //   "<hex>"         (raw hex)
  //   "v1=<hex>"      (some providers)
  const normalizedSig = signature.replace(/^(sha256=|v1=)/, '')
  const expectedSig = createHmac('sha256', secret).update(rawBody).digest('hex')

  // ─── Step 5: timing-safe comparison ─────────────────────
  // Convert both to buffers of equal length. If lengths differ, the
  // signature is wrong, but we still call timingSafeEqual to avoid
  // leaking information via timing.
  const sigBuf = Buffer.from(normalizedSig, 'hex')
  const expBuf = Buffer.from(expectedSig, 'hex')

  if (sigBuf.length !== expBuf.length) {
    return { ok: false, reason: 'invalid_signature', provider }
  }

  try {
    const valid = timingSafeEqual(sigBuf, expBuf)
    return valid
      ? { ok: true, provider }
      : { ok: false, reason: 'invalid_signature', provider }
  } catch {
    // Buffer.from(..., 'hex') on invalid hex throws — treat as invalid sig
    return { ok: false, reason: 'invalid_signature', provider }
  }
}

/**
 * Convenience helper: extract signature from common header names.
 * Different providers use different headers:
 *   - Orange Money: x-signature
 *   - MTN MoMo: x-hub-signature-256
 *   - Celcom: x-celcom-signature
 *   - Generic: x-webhook-signature
 */
export function extractSignatureFromHeaders(
  headers: Headers,
): string | null {
  const headerNames = [
    'x-signature',
    'x-hub-signature-256',
    'x-celcom-signature',
    'x-webhook-signature',
    'x-orange-signature',
    'x-mtn-signature',
  ]
  for (const name of headerNames) {
    const value = headers.get(name)
    if (value) return value
  }
  return null
}

/**
 * Identify provider from request headers.
 * Returns 'generic' if no provider hint is found.
 */
export function identifyProvider(headers: Headers, body: unknown): WebhookProvider {
  // Explicit header
  const explicit = headers.get('x-provider') || headers.get('x-source')
  if (explicit && isValidProvider(explicit)) return explicit

  // Body field (some providers include it in the payload)
  if (body && typeof body === 'object' && 'provider' in body) {
    const v = (body as Record<string, unknown>).provider
    if (typeof v === 'string' && isValidProvider(v)) return v
  }

  // User-agent sniffing (best-effort)
  const ua = headers.get('user-agent') || ''
  if (ua.toLowerCase().includes('orange')) return 'orange_money'
  if (ua.toLowerCase().includes('mtn')) return 'mtn_money'
  if (ua.toLowerCase().includes('celcom')) return 'celcom_money'

  return 'generic'
}

function isValidProvider(v: string): v is WebhookProvider {
  return v in PROVIDER_SECRET_ENV
}
