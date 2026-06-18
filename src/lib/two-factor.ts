// ============================================================
// CodeRoute Guinée — Two-Factor Authentication (TOTP)
// RFC 6238 compliant — compatible with Google Authenticator,
// Microsoft Authenticator, Authy, etc.
// Uses Web Crypto API for Edge compatibility
// ============================================================

import { db } from '@/lib/db'

// ─── TOTP Configuration ────────────────────────────────────
const TOTP_ISSUER = 'CodeRoute Guinée'
const TOTP_PERIOD = 30 // seconds
const TOTP_DIGITS = 6
const TOTP_WINDOW = 1 // allow 1 step before/after for clock skew

// ─── Base32 encoding/decoding ──────────────────────────────
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

export function base32Encode(buffer: Uint8Array): string {
  let result = ''
  let bits = 0
  let value = 0

  for (const byte of buffer) {
    value = (value << 8) | byte
    bits += 8

    while (bits >= 5) {
      result += BASE32_ALPHABET[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }

  if (bits > 0) {
    result += BASE32_ALPHABET[(value << (5 - bits)) & 31]
  }

  return result
}

export function base32Decode(encoded: string): Uint8Array {
  const cleaned = encoded.replace(/=+$/, '').toUpperCase()
  const bytes: number[] = []
  let bits = 0
  let value = 0

  for (const char of cleaned) {
    const index = BASE32_ALPHABET.indexOf(char)
    if (index === -1) continue

    value = (value << 5) | index
    bits += 5

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff)
      bits -= 8
    }
  }

  return new Uint8Array(bytes)
}

// ─── Generate a new TOTP secret ────────────────────────────
export async function generateTotpSecret(): Promise<{ secret: string; qrUri: string }> {
  const secretBytes = new Uint8Array(20)
  crypto.getRandomValues(secretBytes)
  const secret = base32Encode(secretBytes)

  const qrUri = `otpauth://totp/${encodeURIComponent(TOTP_ISSUER)}:${encodeURIComponent(TOTP_ISSUER)}?secret=${secret}&issuer=${encodeURIComponent(TOTP_ISSUER)}&algorithm=SHA1&digits=${TOTP_DIGITS}&period=${TOTP_PERIOD}`

  return { secret, qrUri }
}

// ─── Generate TOTP code for a given secret and timestamp ───
async function generateTotp(secret: string, timestamp: number = Date.now()): Promise<string> {
  const counter = Math.floor(timestamp / 1000 / TOTP_PERIOD)
  const buffer = new ArrayBuffer(8)
  const view = new DataView(buffer)
  // Write counter as 64-bit big-endian
  view.setUint32(0, Math.floor(counter / 0x100000000))
  view.setUint32(4, counter & 0xffffffff)

  const key = await crypto.subtle.importKey(
    'raw',
    base32Decode(secret) as BufferSource,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign('HMAC', key, buffer)
  const signatureBytes = new Uint8Array(signature)

  // Dynamic truncation
  const offset = signatureBytes[signatureBytes.length - 1] & 0x0f
  const truncated =
    ((signatureBytes[offset] & 0x7f) << 24) |
    ((signatureBytes[offset + 1] & 0xff) << 16) |
    ((signatureBytes[offset + 2] & 0xff) << 8) |
    (signatureBytes[offset + 3] & 0xff)

  const code = truncated % Math.pow(10, TOTP_DIGITS)
  return code.toString().padStart(TOTP_DIGITS, '0')
}

// ─── Verify a TOTP code ────────────────────────────────────
export async function verifyTotp(secret: string, code: string): Promise<boolean> {
  const now = Date.now()

  // Check current time + window (before and after)
  for (let i = -TOTP_WINDOW; i <= TOTP_WINDOW; i++) {
    const testTime = now + i * TOTP_PERIOD * 1000
    const expectedCode = await generateTotp(secret, testTime)
    if (expectedCode === code) {
      return true
    }
  }

  return false
}

// ─── Generate backup codes (single-use) ────────────────────
export async function generateBackupCodes(count: number = 10): Promise<{ plain: string[]; hashed: string[] }> {
  const plain: string[] = []
  const hashed: string[] = []

  for (let i = 0; i < count; i++) {
    const bytes = new Uint8Array(5)
    crypto.getRandomValues(bytes)
    const code = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase()
    plain.push(`${code.slice(0, 5)}-${code.slice(5, 10)}`)

    // Hash the backup code for storage
    const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(code))
    const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')
    hashed.push(hashHex)
  }

  return { plain, hashed }
}

// ─── Verify a backup code ──────────────────────────────────
export async function verifyBackupCode(hashedCodes: string[], providedCode: string): Promise<number> {
  // Remove dashes and uppercase
  const normalized = providedCode.replace(/-/g, '').toUpperCase()

  const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalized))
  const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')

  return hashedCodes.indexOf(hashHex)
}

// ─── Setup 2FA for a user ──────────────────────────────────
export async function setupTwoFactor(userId: string): Promise<{ secret: string; qrUri: string; backupCodes: string[] }> {
  const { secret, qrUri } = await generateTotpSecret()
  const { plain, hashed } = await generateBackupCodes(10)

  // Store the secret (disabled until verified) and backup codes
  await db.twoFactorSecret.upsert({
    where: { userId },
    create: {
      userId,
      secret,
      backupCodes: JSON.stringify(hashed),
      enabled: false,
    },
    update: {
      secret,
      backupCodes: JSON.stringify(hashed),
      enabled: false,
      verifiedAt: null,
    },
  })

  return { secret, qrUri, backupCodes: plain }
}

// ─── Verify and enable 2FA ─────────────────────────────────
export async function enableTwoFactor(userId: string, code: string): Promise<{ success: boolean; error?: string }> {
  const twoFactor = await db.twoFactorSecret.findUnique({ where: { userId } })

  if (!twoFactor) {
    return { success: false, error: '2FA non configuré. Veuillez recommencer la configuration.' }
  }

  if (twoFactor.enabled) {
    return { success: false, error: '2FA déjà activé.' }
  }

  const isValid = await verifyTotp(twoFactor.secret, code)
  if (!isValid) {
    return { success: false, error: 'Code TOTP invalide. Vérifiez votre application d\'authentification.' }
  }

  await db.twoFactorSecret.update({
    where: { userId },
    data: {
      enabled: true,
      verifiedAt: new Date(),
    },
  })

  return { success: true }
}

// ─── Disable 2FA ───────────────────────────────────────────
export async function disableTwoFactor(userId: string): Promise<{ success: boolean; error?: string }> {
  await db.twoFactorSecret.deleteMany({ where: { userId } })
  return { success: true }
}

// ─── Verify 2FA during login ───────────────────────────────
export async function verifyTwoFactorLogin(
  userId: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  const twoFactor = await db.twoFactorSecret.findUnique({ where: { userId } })

  if (!twoFactor || !twoFactor.enabled) {
    return { success: true } // No 2FA required
  }

  // Try TOTP code first
  const totpValid = await verifyTotp(twoFactor.secret, code)
  if (totpValid) {
    return { success: true }
  }

  // Try backup code
  const hashedCodes = JSON.parse(twoFactor.backupCodes) as string[]
  const backupIndex = await verifyBackupCode(hashedCodes, code)
  if (backupIndex >= 0) {
    // Remove the used backup code
    hashedCodes.splice(backupIndex, 1)
    await db.twoFactorSecret.update({
      where: { userId },
      data: { backupCodes: JSON.stringify(hashedCodes) },
    })
    return { success: true }
  }

  return { success: false, error: 'Code 2FA invalide.' }
}

// ─── Check if user has 2FA enabled ─────────────────────────
export async function isTwoFactorEnabled(userId: string): Promise<boolean> {
  const twoFactor = await db.twoFactorSecret.findUnique({ where: { userId } })
  return !!twoFactor?.enabled
}

// ─── Get 2FA status (without secret) ───────────────────────
export async function getTwoFactorStatus(userId: string): Promise<{ enabled: boolean; verifiedAt: string | null; backupCodesRemaining: number }> {
  const twoFactor = await db.twoFactorSecret.findUnique({ where: { userId } })
  if (!twoFactor) {
    return { enabled: false, verifiedAt: null, backupCodesRemaining: 0 }
  }
  return {
    enabled: twoFactor.enabled,
    verifiedAt: twoFactor.verifiedAt?.toISOString() || null,
    backupCodesRemaining: (JSON.parse(twoFactor.backupCodes) as string[]).length,
  }
}
