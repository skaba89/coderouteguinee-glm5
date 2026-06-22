// ============================================================
// Tests unitaires — Sentry wrapper (Sprint 2)
// ============================================================

import {
  isSentryConfigured,
  captureException,
  captureMessage,
  startSpan,
} from '../sentry'

const ORIGINAL_ENV = { ...process.env }

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV } as NodeJS.ProcessEnv
  delete process.env.SENTRY_DSN
})

afterAll(() => {
  process.env = { ...ORIGINAL_ENV } as NodeJS.ProcessEnv
})

// ============================================================
// isSentryConfigured
// ============================================================
describe('isSentryConfigured', () => {
  test('returns false when SENTRY_DSN not set', () => {
    delete process.env.SENTRY_DSN
    expect(isSentryConfigured()).toBe(false)
  })

  test('returns false when SENTRY_DSN is empty', () => {
    process.env.SENTRY_DSN = ''
    expect(isSentryConfigured()).toBe(false)
  })

  test('returns false when SENTRY_DSN is not https URL', () => {
    process.env.SENTRY_DSN = 'http://not-secure@example.com/123'
    expect(isSentryConfigured()).toBe(false)
  })

  test('returns true when SENTRY_DSN is valid https URL', () => {
    process.env.SENTRY_DSN = 'https://abc123@sentry.example.com/1'
    expect(isSentryConfigured()).toBe(true)
  })
})

// ============================================================
// captureException
// ============================================================
describe('captureException', () => {
  test('no-op when Sentry not configured (no error thrown)', () => {
    delete process.env.SENTRY_DSN
    expect(() => {
      captureException(new Error('test error'))
    }).not.toThrow()
  })

  test('logs to console in dev when not configured', () => {
    delete process.env.SENTRY_DSN
    ;(process.env as Record<string, string>).NODE_ENV = 'development'
    const errSpy = jest.spyOn(console, 'error').mockImplementation()

    captureException(new Error('test error'), {
      tags: { feature: 'payment' },
    })

    expect(errSpy).toHaveBeenCalled()
    errSpy.mockRestore()
  })

  test('silent in production when not configured', () => {
    delete process.env.SENTRY_DSN
    ;(process.env as Record<string, string>).NODE_ENV = 'production'
    const errSpy = jest.spyOn(console, 'error').mockImplementation()

    captureException(new Error('test error'))

    expect(errSpy).not.toHaveBeenCalled()
    errSpy.mockRestore()
  })

  test('handles non-Error objects', () => {
    delete process.env.SENTRY_DSN
    expect(() => {
      captureException('string error')
      captureException({ custom: 'object' })
      captureException(null)
      captureException(undefined)
    }).not.toThrow()
  })

  test('accepts context with user, tags, and extra', () => {
    delete process.env.SENTRY_DSN
    expect(() => {
      captureException(new Error('test'), {
        user: { id: 'user-1', email: 'a@b.com', role: 'admin' },
        tags: { feature: 'payment', provider: 'orange' },
        extra: { amount: 350000, currency: 'GNF' },
      })
    }).not.toThrow()
  })

  test('gracefully degrades when @sentry/nextjs not installed but DSN set', () => {
    process.env.SENTRY_DSN = 'https://abc@sentry.example.com/1'
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation()
    const errSpy = jest.spyOn(console, 'error').mockImplementation()

    expect(() => {
      captureException(new Error('test'))
    }).not.toThrow()

    // Should warn about missing package
    expect(warnSpy).toHaveBeenCalled()
    warnSpy.mockRestore()
    errSpy.mockRestore()
  })
})

// ============================================================
// captureMessage
// ============================================================
describe('captureMessage', () => {
  test('no-op when Sentry not configured', () => {
    delete process.env.SENTRY_DSN
    expect(() => {
      captureMessage('test message')
      captureMessage('test', 'info')
      captureMessage('test', 'warning')
      captureMessage('test', 'error')
    }).not.toThrow()
  })

  test('accepts all severity levels', () => {
    delete process.env.SENTRY_DSN
    expect(() => {
      captureMessage('info msg', 'info')
      captureMessage('warning msg', 'warning')
      captureMessage('error msg', 'error')
    }).not.toThrow()
  })

  test('accepts context', () => {
    delete process.env.SENTRY_DSN
    expect(() => {
      captureMessage('msg', 'info', {
        user: { id: 'u1' },
        tags: { feature: 'booking' },
      })
    }).not.toThrow()
  })
})

// ============================================================
// startSpan
// ============================================================
describe('startSpan', () => {
  test('returns object with finish() method when not configured', () => {
    delete process.env.SENTRY_DSN
    const span = startSpan('test-op', 'test')
    expect(span).toBeDefined()
    expect(typeof span.finish).toBe('function')
    expect(() => span.finish()).not.toThrow()
  })

  test('finish() is idempotent', () => {
    delete process.env.SENTRY_DSN
    const span = startSpan('test-op')
    span.finish()
    span.finish()
    span.finish()
    // No throw = pass
  })

  test('accepts name and op parameters', () => {
    delete process.env.SENTRY_DSN
    expect(() => {
      const span = startSpan('payment.initiate', 'orange_money')
      span.finish()
    }).not.toThrow()
  })
})
