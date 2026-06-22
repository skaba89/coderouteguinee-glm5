// ============================================================
// Tests unitaires — Email (SMTP) integration (Sprint 2)
// ============================================================

import {
  getEmailConfig,
  sendEmail,
  verifySmtpConnection,
  _resetTransporterCacheForTests,
} from '../email'

const ORIGINAL_ENV = { ...process.env }

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV } as NodeJS.ProcessEnv
  _resetTransporterCacheForTests()
})

afterAll(() => {
  process.env = { ...ORIGINAL_ENV } as NodeJS.ProcessEnv
})

// ============================================================
// getEmailConfig
// ============================================================
describe('getEmailConfig', () => {
  test('returns null when SMTP_HOST not set', () => {
    delete process.env.SMTP_HOST
    expect(getEmailConfig()).toBeNull()
  })

  test('returns config with defaults when only SMTP_HOST set', () => {
    process.env.SMTP_HOST = 'smtp.example.com'
    delete process.env.SMTP_PORT
    delete process.env.SMTP_SECURE
    delete process.env.SMTP_USER
    delete process.env.SMTP_PASS
    delete process.env.SMTP_FROM_NAME
    delete process.env.SMTP_FROM_EMAIL

    const config = getEmailConfig()
    expect(config).not.toBeNull()
    expect(config!.host).toBe('smtp.example.com')
    expect(config!.port).toBe(587) // default
    expect(config!.secure).toBe(false) // default
    expect(config!.user).toBe('')
    expect(config!.fromName).toBe('CodeRoute Guinée') // default
    expect(config!.fromEmail).toBe('noreply@coderoute-gn.org') // default
  })

  test('reads all env vars correctly', () => {
    process.env.SMTP_HOST = 'smtp.mailgun.org'
    process.env.SMTP_PORT = '465'
    process.env.SMTP_SECURE = 'true'
    process.env.SMTP_USER = 'postmaster@mg.example.com'
    process.env.SMTP_PASS = 'secret-password'
    process.env.SMTP_FROM_NAME = 'CodeRoute GN'
    process.env.SMTP_FROM_EMAIL = 'no-reply@mg.example.com'

    const config = getEmailConfig()
    expect(config).toEqual({
      host: 'smtp.mailgun.org',
      port: 465,
      secure: true,
      user: 'postmaster@mg.example.com',
      pass: 'secret-password',
      fromName: 'CodeRoute GN',
      fromEmail: 'no-reply@mg.example.com',
    })
  })
})

// ============================================================
// sendEmail — routing logic
// ============================================================
describe('sendEmail', () => {
  beforeEach(() => {
    // Suppress console.log in tests
    jest.spyOn(console, 'log').mockImplementation()
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('routes to console when neither SMTP nor EMAIL_API_URL set', async () => {
    delete process.env.SMTP_HOST
    delete process.env.EMAIL_API_URL

    const result = await sendEmail('user@example.com', 'Subject', 'Body')
    expect(result.success).toBe(true)
    expect(result.provider).toBe('console')
  })

  test('routes to HTTP API when EMAIL_API_URL set (regardless of SMTP)', async () => {
    process.env.EMAIL_API_URL = 'https://api.sendgrid.com/v3/mail/send'
    process.env.EMAIL_API_KEY = 'SG.test-key'
    delete process.env.SMTP_HOST

    // Mock fetch to simulate SendGrid 202 Accepted
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response('{}', { status: 202 }),
    )

    const result = await sendEmail('user@example.com', 'Test', 'Body')
    expect(result.success).toBe(true)
    expect(result.provider).toBe('http-api')
    expect(fetchSpy).toHaveBeenCalled()
  })

  test('HTTP API failure returns error', async () => {
    process.env.EMAIL_API_URL = 'https://api.sendgrid.com/v3/mail/send'
    process.env.EMAIL_API_KEY = 'SG.bad-key'

    jest.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response('{"errors": [{"message": "Invalid API key"}]}', { status: 401 }),
    )

    const result = await sendEmail('user@example.com', 'Test', 'Body')
    expect(result.success).toBe(false)
    expect(result.provider).toBe('http-api')
    expect(result.error).toContain('401')
  })

  test('HTTP API network error returns error', async () => {
    process.env.EMAIL_API_URL = 'https://api.sendgrid.com/v3/mail/send'

    jest.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('ECONNREFUSED'))

    const result = await sendEmail('user@example.com', 'Test', 'Body')
    expect(result.success).toBe(false)
    expect(result.provider).toBe('http-api')
    expect(result.error).toContain('ECONNREFUSED')
  })

  test('SMTP path is attempted when SMTP_HOST set and no EMAIL_API_URL', async () => {
    process.env.SMTP_HOST = 'localhost'
    process.env.SMTP_PORT = '1' // Invalid port → fast fail
    delete process.env.EMAIL_API_URL

    // The SMTP call will fail because port 1 is not listening
    const result = await sendEmail('user@example.com', 'Test', 'Body')
    expect(result.provider).toBe('smtp')
    // Either success (if SMTP server running on port 1) or error
    expect(typeof result.success).toBe('boolean')
  })
})

// ============================================================
// verifySmtpConnection
// ============================================================
describe('verifySmtpConnection', () => {
  test('returns error when SMTP not configured', async () => {
    delete process.env.SMTP_HOST
    const result = await verifySmtpConnection()
    expect(result.ok).toBe(false)
    expect(result.error).toContain('not configured')
  })

  test('attempts connection when SMTP_HOST set', async () => {
    process.env.SMTP_HOST = 'localhost'
    process.env.SMTP_PORT = '1' // Invalid port → fast fail
    const result = await verifySmtpConnection()
    // Will fail because nothing listens on port 1
    expect(result.ok).toBe(false)
    expect(result.error).toBeDefined()
  })
})
