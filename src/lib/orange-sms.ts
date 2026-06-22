// ============================================================
// CodeRoute Guinée — Orange SMS OAuth2 Integration (Phase 29)
// ============================================================
// Real implementation of the Orange Guinea SMS API:
//   1. OAuth2 client-credentials flow → bearer access token
//   2. POST /smsmessaging/v1/outbound/.../requests to send SMS
//   3. Token caching with expiry (60 min default from Orange)
//   4. Sender address must match the Orange-provisioned number
//   5. Quota tracking via response headers (X-Cdr-*)
//
// Docs: https://developer.orange.com/api/sms-gu
// Env vars (set in .env for production):
//   ORANGE_SMS_CLIENT_ID       — OAuth2 client id
//   ORANGE_SMS_CLIENT_SECRET   — OAuth2 client secret
//   ORANGE_SMS_SENDER_ADDRESS  — tel:+224XXXXXXXXX (provisioned)
//   ORANGE_SMS_API_BASE        — https://api.orange.com (default)
//
// If env vars are missing, the module falls back to "console" mode
// so dev environments keep working without real credentials.
// ============================================================

export interface OrangeSmsConfig {
  clientId: string
  clientSecret: string
  senderAddress: string // e.g. "tel:+224628000000"
  apiBase: string // e.g. "https://api.orange.com"
}

export interface OrangeSmsResult {
  success: boolean
  provider: 'orange' | 'console'
  messageId?: string
  error?: string
  remainingQuota?: number
}

interface OrangeTokenResponse {
  access_token: string
  token_type: 'Bearer'
  expires_in: number // seconds
  scope?: string
}

interface OrangeSmsApiSuccess {
  outbondSMSMessageRequest: {
    deliveryInfoList: {
      deliveryInfo: Array<{
        address: string
        deliveryStatus: string
      }>
    }
    resourceURL: string
    senderAddresses: string[]
  }
}

interface OrangeSmsApiError {
  code: string
  message: string
  description: string
}

// ─── In-memory token cache (single process) ───────────────
let cachedToken: { value: string; expiresAt: number } | null = null

export function _resetTokenCacheForTests(): void {
  cachedToken = null
}

/**
 * Read configuration from environment variables.
 * Returns null if any required var is missing → caller falls back to console.
 */
export function getOrangeSmsConfig(): OrangeSmsConfig | null {
  const clientId = process.env.ORANGE_SMS_CLIENT_ID?.trim()
  const clientSecret = process.env.ORANGE_SMS_CLIENT_SECRET?.trim()
  const senderAddress = (process.env.ORANGE_SMS_SENDER_ADDRESS || '').trim()
  const apiBase = (process.env.ORANGE_SMS_API_BASE || 'https://api.orange.com').trim()

  if (!clientId || !clientSecret || !senderAddress) {
    return null
  }
  return { clientId, clientSecret, senderAddress, apiBase }
}

/**
 * Basic Auth header for OAuth2 token request.
 * Format: Basic base64(client_id:client_secret)
 */
function buildBasicAuth(clientId: string, clientSecret: string): string {
  const credentials = `${clientId}:${clientSecret}`
  // Use Buffer in Node, btoa in edge runtime
  if (typeof Buffer !== 'undefined') {
    return `Basic ${Buffer.from(credentials).toString('base64')}`
  }
  return `Basic ${btoa(credentials)}`
}

/**
 * Obtain an OAuth2 access token from Orange.
 * Uses client_credentials grant type.
 * Caches the token until (expiresAt - 60s) to avoid edge expiry races.
 */
export async function getOrangeAccessToken(config: OrangeSmsConfig): Promise<string> {
  // Return cached token if still valid (with 60s safety margin)
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.value
  }

  const url = `${config.apiBase}/oauth/v3/token`
  const body = new URLSearchParams({ grant_type: 'client_credentials' })

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': buildBasicAuth(config.clientId, config.clientSecret),
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body,
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Orange OAuth2 token error (${response.status}): ${errText}`)
  }

  const data = (await response.json()) as OrangeTokenResponse
  if (!data.access_token || data.token_type !== 'Bearer') {
    throw new Error(`Orange OAuth2: invalid token response: ${JSON.stringify(data)}`)
  }

  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  }
  return data.access_token
}

/**
 * Normalize a Guinea phone number to E.164 international format.
 * Accepts: "628123456", "0628123456", "+224628123456", "224 628 12 34 56"
 * Returns: "tel:+224628123456"
 */
export function normalizeGuineaPhone(input: string): string {
  const cleaned = input.replace(/[\s\-()]/g, '')
  let digits = cleaned.replace(/^\+/, '')

  // Strip leading "00" international prefix
  if (digits.startsWith('00')) digits = digits.slice(2)

  // Strip leading country code if present
  if (digits.startsWith('224')) {
    digits = digits.slice(3)
  }
  // Strip leading 0 if present
  digits = digits.replace(/^0/, '')

  // Guinea mobile numbers are 9 digits (6XX XXX XXX after the leading 0)
  if (!/^6\d{8}$/.test(digits)) {
    throw new Error(`Numéro de téléphone invalide (Guinée): ${input}`)
  }
  return `tel:+224${digits}`
}

/**
 * Send an SMS via the Orange SMS API.
 * Falls back to console logging if credentials are not configured.
 */
export async function sendOrangeSms(
  to: string,
  text: string,
): Promise<OrangeSmsResult> {
  const config = getOrangeSmsConfig()

  if (!config) {
    console.log('════════ SMS Orange (console — credentials not set) ════════')
    console.log(`To: ${to}`)
    console.log('─'.repeat(50))
    console.log(text)
    console.log('═══════════════════════════════════════════════════════════')
    return { success: true, provider: 'console' }
  }

  // Validate message constraints from Orange API spec
  if (text.length === 0) {
    return { success: false, provider: 'orange', error: 'Le message SMS est vide' }
  }
  if (text.length > 1530) {
    return { success: false, provider: 'orange', error: `Message trop long (${text.length} > 1530 caractères)` }
  }

  let recipientAddress: string
  try {
    recipientAddress = normalizeGuineaPhone(to)
  } catch (err: any) {
    return { success: false, provider: 'orange', error: err.message }
  }

  try {
    const token = await getOrangeAccessToken(config)

    // URL-encode the sender address for the path
    const senderEncoded = encodeURIComponent(config.senderAddress)
    const url = `${config.apiBase}/smsmessaging/v1/outbound/${senderEncoded}/requests`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        outboundSMSMessageRequest: {
          address: [recipientAddress],
          senderAddress: config.senderAddress,
          outboundSMSTextMessage: { message: text },
          // Orange supports FR and EN; FR is required for Guinea
          'senderName': 'CodeRoute',
        },
      }),
    })

    // Parse remaining-quota header if present
    const remainingQuotaHeader = response.headers.get('X-Cdr-Remaining-Quota')
    const remainingQuota = remainingQuotaHeader
      ? parseInt(remainingQuotaHeader, 10)
      : undefined

    if (!response.ok) {
      const errText = await response.text()
      let errMsg: string
      try {
        const errJson = JSON.parse(errText) as OrangeSmsApiError
        errMsg = `${errJson.code || response.status}: ${errJson.message || errText}`
      } catch {
        errMsg = `Orange SMS API error (${response.status}): ${errText}`
      }
      return { success: false, provider: 'orange', error: errMsg, remainingQuota }
    }

    const data = (await response.json()) as OrangeSmsApiSuccess
    const deliveryInfo = data.outbondSMSMessageRequest?.deliveryInfoList?.deliveryInfo?.[0]
    const messageId = data.outbondSMSMessageRequest?.resourceURL?.split('/')?.pop()

    // Orange returns "Delivered" or "Submission" accepted
    if (deliveryInfo && deliveryInfo.deliveryStatus === 'DeliveryImpossible') {
      return {
        success: false,
        provider: 'orange',
        error: `Livraison impossible: ${deliveryInfo.address}`,
        remainingQuota,
      }
    }

    return {
      success: true,
      provider: 'orange',
      messageId,
      remainingQuota,
    }
  } catch (err: any) {
    return { success: false, provider: 'orange', error: err.message }
  }
}

/**
 * Check if Orange SMS is properly configured.
 * Used by the admin UI to show a status badge.
 */
export function isOrangeSmsConfigured(): boolean {
  return getOrangeSmsConfig() !== null
}

/**
 * Send a test SMS (admin "ping" feature).
 * Returns full diagnostic info for the UI.
 */
export async function sendTestOrangeSms(to: string): Promise<OrangeSmsResult & { diagnostic: Record<string, unknown> }> {
  const start = Date.now()
  const result = await sendOrangeSms(
    to,
    `[CodeRoute] SMS de test — ${new Date().toLocaleString('fr-FR')}`,
  )
  const elapsedMs = Date.now() - start

  return {
    ...result,
    diagnostic: {
      elapsedMs,
      configured: isOrangeSmsConfigured(),
      timestamp: new Date().toISOString(),
    },
  }
}
