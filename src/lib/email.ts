// ============================================================
// CodeRoute Guinée — Email (SMTP) integration (Sprint 2)
// ============================================================
// Real SMTP email sending via nodemailer. Supports:
//   - Plain SMTP (port 587, STARTTLS)
//   - Secure SMTP (port 465, implicit TLS)
//   - HTTP email API (SendGrid, Mailgun, Brevo) as fallback
//   - Console logging (dev only — no email actually sent)
//
// Configuration via env vars (see .env.example):
//   SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS,
//   SMTP_FROM_NAME, SMTP_FROM_EMAIL
//
// Optional HTTP API (takes precedence if EMAIL_API_URL is set):
//   EMAIL_API_URL, EMAIL_API_KEY
// ============================================================

import nodemailer, { type Transporter } from 'nodemailer'

export interface EmailResult {
  success: boolean
  error?: string
  provider: 'smtp' | 'http-api' | 'console'
  messageId?: string
}

export interface EmailConfig {
  host: string
  port: number
  secure: boolean
  user: string
  pass: string
  fromName: string
  fromEmail: string
}

// ─── Cached transporter (singleton) ───────────────────────
// nodemailer transporters are designed to be reused — they keep
// the SMTP connection pool warm. We cache one per process.
let cachedTransporter: Transporter | null = null
let cachedConfigKey: string | null = null

/**
 * Get the email configuration from env vars.
 * Returns null if SMTP_HOST is not set.
 */
export function getEmailConfig(): EmailConfig | null {
  if (!process.env.SMTP_HOST) return null
  return {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    fromName: process.env.SMTP_FROM_NAME || 'CodeRoute Guinée',
    fromEmail: process.env.SMTP_FROM_EMAIL || 'noreply@coderoute-gn.org',
  }
}

/**
 * Build a cache key from config — so we re-create the transporter
 * if the config changes (e.g., env vars updated).
 */
function configKey(c: EmailConfig): string {
  return `${c.host}:${c.port}:${c.secure}:${c.user}`
}

/**
 * Get (or create) the nodemailer transporter.
 */
function getTransporter(config: EmailConfig): Transporter {
  const key = configKey(config)
  if (cachedTransporter && cachedConfigKey === key) {
    return cachedTransporter
  }
  cachedTransporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.user ? { user: config.user, pass: config.pass } : undefined,
    // Pool connections for performance
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    // Timeouts (defensive — SMTP servers can hang)
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 30_000,
  })
  cachedConfigKey = key
  return cachedTransporter
}

/**
 * Send an email. Routes to:
 *   1. HTTP API (if EMAIL_API_URL set) — for SendGrid/Mailgun/Brevo
 *   2. SMTP (if SMTP_HOST set) — for self-hosted or SMTP-relay providers
 *   3. Console (dev fallback — no email actually sent)
 */
export async function sendEmail(
  to: string,
  subject: string,
  body: string,
  opts?: { html?: string; replyTo?: string },
): Promise<EmailResult> {
  // ─── Path 1: HTTP API (SendGrid/Mailgun/Brevo) ─────────
  const emailApiUrl = process.env.EMAIL_API_URL
  if (emailApiUrl) {
    return sendViaHttpApi(emailApiUrl, to, subject, body, opts)
  }

  // ─── Path 2: SMTP ──────────────────────────────────────
  const config = getEmailConfig()
  if (config) {
    return sendViaSmtp(config, to, subject, body, opts)
  }

  // ─── Path 3: Console (dev) ─────────────────────────────
  console.log('════════ EMAIL (console — SMTP not configured) ════════')
  console.log(`To: ${to}`)
  console.log(`Subject: ${subject}`)
  console.log('─'.repeat(50))
  console.log(body)
  console.log('════════════════════════════════════════════════════════')
  return { success: true, provider: 'console' }
}

/**
 * Send email via SMTP using nodemailer.
 */
async function sendViaSmtp(
  config: EmailConfig,
  to: string,
  subject: string,
  body: string,
  opts?: { html?: string; replyTo?: string },
): Promise<EmailResult> {
  try {
    const transporter = getTransporter(config)
    const info = await transporter.sendMail({
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to,
      subject,
      text: body,
      html: opts?.html,
      replyTo: opts?.replyTo,
    })
    return {
      success: true,
      provider: 'smtp',
      messageId: info.messageId,
    }
  } catch (err: any) {
    return {
      success: false,
      provider: 'smtp',
      error: `SMTP error: ${err.message || err.code || 'unknown'}`,
    }
  }
}

/**
 * Send email via HTTP API (SendGrid/Mailgun/Brevo generic JSON).
 * Expected response: 200/202 = success.
 */
async function sendViaHttpApi(
  apiUrl: string,
  to: string,
  subject: string,
  body: string,
  opts?: { html?: string; replyTo?: string },
): Promise<EmailResult> {
  try {
    const fromName = process.env.SMTP_FROM_NAME || 'CodeRoute Guinée'
    const fromEmail = process.env.SMTP_FROM_EMAIL || 'noreply@coderoute-gn.org'
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.EMAIL_API_KEY || ''}`,
      },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to,
        subject,
        text: body,
        html: opts?.html,
        reply_to: opts?.replyTo,
      }),
    })
    if (!response.ok) {
      const errText = await response.text().catch(() => '')
      return {
        success: false,
        provider: 'http-api',
        error: `Email API error ${response.status}: ${errText.slice(0, 200)}`,
      }
    }
    return { success: true, provider: 'http-api' }
  } catch (err: any) {
    return {
      success: false,
      provider: 'http-api',
      error: `HTTP API error: ${err.message || 'unknown'}`,
    }
  }
}

/**
 * Verify SMTP connection (used by health check).
 * Returns true if connection succeeds, false otherwise.
 */
export async function verifySmtpConnection(): Promise<{
  ok: boolean
  error?: string
}> {
  const config = getEmailConfig()
  if (!config) {
    return { ok: false, error: 'SMTP_HOST not configured' }
  }
  try {
    const transporter = getTransporter(config)
    await transporter.verify()
    return { ok: true }
  } catch (err: any) {
    return {
      ok: false,
      error: `SMTP verify failed: ${err.message || err.code || 'unknown'}`,
    }
  }
}

/**
 * For testing: reset the cached transporter.
 * (Jest uses this between tests.)
 */
export function _resetTransporterCacheForTests(): void {
  cachedTransporter = null
  cachedConfigKey = null
}
