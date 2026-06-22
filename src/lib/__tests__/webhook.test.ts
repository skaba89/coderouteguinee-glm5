// ============================================================
// Tests unitaires — Webhook HMAC verification (Sprint 2)
// ============================================================

import { createHmac } from 'crypto'
import {
  verifyWebhookSignature,
  extractSignatureFromHeaders,
  identifyProvider,
  getWebhookSecret,
  type WebhookProvider,
} from '../webhook'

// ─── Helpers ────────────────────────────────────────────────
const ORIGINAL_ENV = { ...process.env }
const TEST_SECRET = 'a'.repeat(64) // 64-char hex secret (32 bytes)
const SHORT_SECRET = 'short'

function setSecret(provider: WebhookProvider, value: string | undefined) {
  const envMap: Record<WebhookProvider, string> = {
    orange_money: 'ORANGE_MONEY_WEBHOOK_SECRET',
    mtn_money: 'MTN_MONEY_WEBHOOK_SECRET',
    celcom_money: 'CELCOM_MONEY_WEBHOOK_SECRET',
    orange_sms: 'ORANGE_SMS_WEBHOOK_SECRET',
    generic: 'WEBHOOK_SECRET',
  }
  if (value === undefined) delete process.env[envMap[provider]]
  else process.env[envMap[provider]] = value
}

function makeSignature(secret: string, body: string): string {
  return createHmac('sha256', secret).update(body).digest('hex')
}

beforeEach(() => {
  // Reset env between tests
  process.env = { ...ORIGINAL_ENV } as NodeJS.ProcessEnv
  // Reset NODE_ENV to test (was maybe 'production' from previous test)
  ;(process.env as Record<string, string>).NODE_ENV = "test"
})

afterAll(() => {
  process.env = { ...ORIGINAL_ENV } as NodeJS.ProcessEnv
})

// ============================================================
// verifyWebhookSignature
// ============================================================
describe('verifyWebhookSignature', () => {
  const provider: WebhookProvider = 'orange_money'
  const body = '{"transactionId":"abc-123","status":"SUCCESSFUL"}'

  test('accepts valid signature', () => {
    setSecret(provider, TEST_SECRET)
    const sig = makeSignature(TEST_SECRET, body)
    const result = verifyWebhookSignature(provider, body, sig)
    expect(result.ok).toBe(true)
    expect(result.reason).toBeUndefined()
  })

  test('accepts sha256= prefixed signature (GitHub-style)', () => {
    setSecret(provider, TEST_SECRET)
    const sig = 'sha256=' + makeSignature(TEST_SECRET, body)
    const result = verifyWebhookSignature(provider, body, sig)
    expect(result.ok).toBe(true)
  })

  test('accepts v1= prefixed signature (Stripe-style)', () => {
    setSecret(provider, TEST_SECRET)
    const sig = 'v1=' + makeSignature(TEST_SECRET, body)
    const result = verifyWebhookSignature(provider, body, sig)
    expect(result.ok).toBe(true)
  })

  test('rejects invalid signature', () => {
    setSecret(provider, TEST_SECRET)
    const result = verifyWebhookSignature(provider, body, 'deadbeef'.repeat(8))
    expect(result.ok).toBe(false)
    expect(result.reason).toBe('invalid_signature')
  })

  test('rejects tampered body', () => {
    setSecret(provider, TEST_SECRET)
    const sig = makeSignature(TEST_SECRET, body)
    const tampered = body + ', "extra": "evil"'
    const result = verifyWebhookSignature(provider, tampered, sig)
    expect(result.ok).toBe(false)
    expect(result.reason).toBe('invalid_signature')
  })

  test('rejects missing signature', () => {
    setSecret(provider, TEST_SECRET)
    const result = verifyWebhookSignature(provider, body, null)
    expect(result.ok).toBe(false)
    expect(result.reason).toBe('missing_signature')
  })

  test('rejects empty signature', () => {
    setSecret(provider, TEST_SECRET)
    const result = verifyWebhookSignature(provider, body, '')
    expect(result.ok).toBe(false)
    expect(result.reason).toBe('missing_signature')
  })

  test('fails-closed in production when secret missing', () => {
    (process.env as Record<string, string>).NODE_ENV = "production"
    setSecret(provider, undefined)
    const result = verifyWebhookSignature(provider, body, 'any-signature')
    expect(result.ok).toBe(false)
    expect(result.reason).toBe('no_secret')
  })

  test('fails-open in dev when secret missing (for DX)', () => {
    (process.env as Record<string, string>).NODE_ENV = "development"
    setSecret(provider, undefined)
    const result = verifyWebhookSignature(provider, body, 'any-signature')
    expect(result.ok).toBe(true)
  })

  test('fails-closed in production when secret too short', () => {
    (process.env as Record<string, string>).NODE_ENV = "production"
    setSecret(provider, SHORT_SECRET)
    const sig = makeSignature(SHORT_SECRET, body)
    const result = verifyWebhookSignature(provider, body, sig)
    expect(result.ok).toBe(false)
    expect(result.reason).toBe('weak_secret')
  })

  test('warns in dev when secret too short (but still verifies)', () => {
    (process.env as Record<string, string>).NODE_ENV = "development"
    setSecret(provider, SHORT_SECRET)
    const sig = makeSignature(SHORT_SECRET, body)
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation()
    const result = verifyWebhookSignature(provider, body, sig)
    expect(result.ok).toBe(true)
    expect(warnSpy).toHaveBeenCalled()
    warnSpy.mockRestore()
  })

  test('rejects non-hex signature gracefully (no throw)', () => {
    setSecret(provider, TEST_SECRET)
    const result = verifyWebhookSignature(provider, body, 'not-hex-at-all')
    expect(result.ok).toBe(false)
    expect(result.reason).toBe('invalid_signature')
  })

  test('each provider uses its own secret', () => {
    setSecret('orange_money', TEST_SECRET)
    setSecret('mtn_money', 'b'.repeat(64))
    const body2 = '{"id":"xyz"}'

    // Signature with orange secret should NOT validate against mtn
    const sig = makeSignature(TEST_SECRET, body2)
    const result = verifyWebhookSignature('mtn_money', body2, sig)
    expect(result.ok).toBe(false)
  })
})

// ============================================================
// getWebhookSecret
// ============================================================
describe('getWebhookSecret', () => {
  test('returns secret when set', () => {
    setSecret('orange_money', TEST_SECRET)
    expect(getWebhookSecret('orange_money')).toBe(TEST_SECRET)
  })

  test('returns null when not set', () => {
    setSecret('orange_money', undefined)
    expect(getWebhookSecret('orange_money')).toBeNull()
  })
})

// ============================================================
// extractSignatureFromHeaders
// ============================================================
describe('extractSignatureFromHeaders', () => {
  test('reads x-signature header', () => {
    const headers = new Headers({ 'x-signature': 'abc123' })
    expect(extractSignatureFromHeaders(headers)).toBe('abc123')
  })

  test('reads x-hub-signature-256 header', () => {
    const headers = new Headers({ 'x-hub-signature-256': 'sha256=def456' })
    expect(extractSignatureFromHeaders(headers)).toBe('sha256=def456')
  })

  test('reads x-celcom-signature header', () => {
    const headers = new Headers({ 'x-celcom-signature': 'celcom-sig' })
    expect(extractSignatureFromHeaders(headers)).toBe('celcom-sig')
  })

  test('reads x-webhook-signature header (generic)', () => {
    const headers = new Headers({ 'x-webhook-signature': 'generic-sig' })
    expect(extractSignatureFromHeaders(headers)).toBe('generic-sig')
  })

  test('returns null when no signature header present', () => {
    const headers = new Headers({ 'content-type': 'application/json' })
    expect(extractSignatureFromHeaders(headers)).toBeNull()
  })

  test('checks headers in priority order (x-signature first)', () => {
    const headers = new Headers({
      'x-signature': 'first',
      'x-hub-signature-256': 'second',
    })
    expect(extractSignatureFromHeaders(headers)).toBe('first')
  })
})

// ============================================================
// identifyProvider
// ============================================================
describe('identifyProvider', () => {
  test('reads x-provider header', () => {
    const headers = new Headers({ 'x-provider': 'orange_money' })
    expect(identifyProvider(headers, null)).toBe('orange_money')
  })

  test('reads x-source header', () => {
    const headers = new Headers({ 'x-source': 'mtn_money' })
    expect(identifyProvider(headers, null)).toBe('mtn_money')
  })

  test('reads provider field from body', () => {
    const headers = new Headers()
    expect(identifyProvider(headers, { provider: 'celcom_money' })).toBe('celcom_money')
  })

  test('sniffs Orange from user-agent', () => {
    const headers = new Headers({ 'user-agent': 'OrangeMoney-Webhook/1.0' })
    expect(identifyProvider(headers, null)).toBe('orange_money')
  })

  test('sniffs MTN from user-agent', () => {
    const headers = new Headers({ 'user-agent': 'MTN-MoMo-Callback/2.1' })
    expect(identifyProvider(headers, null)).toBe('mtn_money')
  })

  test('sniffs Celcom from user-agent', () => {
    const headers = new Headers({ 'user-agent': 'CelcomMoney/1.0' })
    expect(identifyProvider(headers, null)).toBe('celcom_money')
  })

  test('returns generic when no hint', () => {
    const headers = new Headers()
    expect(identifyProvider(headers, null)).toBe('generic')
  })

  test('ignores invalid provider value in header', () => {
    const headers = new Headers({ 'x-provider': 'evil_provider' })
    expect(identifyProvider(headers, null)).toBe('generic')
  })

  test('ignores non-string provider field in body', () => {
    const headers = new Headers()
    expect(identifyProvider(headers, { provider: 42 })).toBe('generic')
  })
})
