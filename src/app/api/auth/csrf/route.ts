// ============================================================
// CodeRoute Guinée — CSRF Token Endpoint
// GET /api/auth/csrf — returns a fresh CSRF token
// ============================================================

import { NextResponse } from 'next/server'

export async function GET() {
  // The actual CSRF token generation and cookie setting
  // is handled by the middleware. This route exists as a
  // well-known endpoint the client can call to obtain a token.
  // The middleware intercepts GET /api/auth/csrf and handles it.
  // This fallback should not be reached, but just in case:
  return NextResponse.json(
    { error: 'CSRF token non disponible. Rechargez la page.' },
    { status: 500 }
  )
}
