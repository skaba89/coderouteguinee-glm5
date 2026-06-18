// ============================================================
// CodeRoute Guinée — CSRF Protection (Edge Runtime Compatible)
// Uses Web Crypto API instead of Node.js crypto module
// Double-submit cookie pattern for API route protection
// ============================================================

import { NextRequest, NextResponse } from 'next/server'

const CSRF_SECRET = process.env.CSRF_SECRET || 'coderoute-csrf-secret-change-in-production'
const CSRF_COOKIE_NAME = 'coderoute_csrf'
const CSRF_HEADER_NAME = 'x-csrf-token'

// ─── Convert string to Uint8Array (BufferSource-compatible) ─
function encoder(str: string): Uint8Array {
  return new TextEncoder().encode(str)
}

// ─── Generate HMAC-SHA256 signature using Web Crypto ───────
async function hmacSign(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder(secret) as BufferSource,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder(data) as BufferSource)
  // Convert ArrayBuffer to hex string
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

// ─── Generate random bytes using Web Crypto ────────────────
function randomHex(length: number): string {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

// ─── Generate a new CSRF token ─────────────────────────────
export async function generateCsrfToken(): Promise<string> {
  const raw = randomHex(32)
  const signature = await hmacSign(raw, CSRF_SECRET)
  return `${raw}.${signature}`
}

// ─── Validate a CSRF token ─────────────────────────────────
export async function validateCsrfToken(token: string): Promise<boolean> {
  if (!token || !token.includes('.')) return false

  const [raw, signature] = token.split('.')
  if (!raw || !signature) return false

  const expectedSignature = await hmacSign(raw, CSRF_SECRET)
  // Constant-time comparison to prevent timing attacks
  if (signature.length !== expectedSignature.length) return false

  let mismatch = 0
  for (let i = 0; i < signature.length; i++) {
    mismatch |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i)
  }
  return mismatch === 0
}

// ─── Set CSRF cookie on response ───────────────────────────
export function setCsrfCookie(response: NextResponse, token: string): void {
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: false, // Must be readable by client JS
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60, // 24 hours
    path: '/',
  })
}

// ─── Get CSRF token from cookie ────────────────────────────
export function getCsrfTokenFromCookie(request: NextRequest): string | null {
  return request.cookies.get(CSRF_COOKIE_NAME)?.value ?? null
}

// ─── Get CSRF token from request header ────────────────────
export function getCsrfTokenFromHeader(request: NextRequest): string | null {
  return request.headers.get(CSRF_HEADER_NAME) ?? null
}

// ─── Check if request method requires CSRF validation ──────
export function isCsrfRequiredMethod(method: string): boolean {
  return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())
}

// ─── Middleware: validate CSRF for state-changing requests ──
export async function validateCsrfRequest(request: NextRequest): Promise<NextResponse | null> {
  if (!isCsrfRequiredMethod(request.method)) {
    return null // No CSRF check needed for GET/HEAD/OPTIONS
  }

  const cookieToken = getCsrfTokenFromCookie(request)
  const headerToken = getCsrfTokenFromHeader(request)

  // Both must be present and match
  if (!cookieToken || !headerToken) {
    return NextResponse.json(
      { error: 'Token CSRF manquant. Rechargez la page et réessayez.' },
      { status: 403 }
    )
  }

  if (cookieToken !== headerToken) {
    return NextResponse.json(
      { error: 'Token CSRF invalide. Rechargez la page et réessayez.' },
      { status: 403 }
    )
  }

  if (!(await validateCsrfToken(cookieToken))) {
    return NextResponse.json(
      { error: 'Token CSRF invalide. Rechargez la page et réessayez.' },
      { status: 403 }
    )
  }

  return null // Valid — pass through
}

// ─── API endpoint: Get a fresh CSRF token ──────────────────
export async function createCsrfResponse(): Promise<NextResponse> {
  const token = await generateCsrfToken()
  const response = NextResponse.json({ csrfToken: token })
  setCsrfCookie(response, token)
  return response
}
