import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/session'
import { validateCsrfRequest, isCsrfRequiredMethod, setCsrfCookie, generateCsrfToken } from '@/lib/csrf'
import { checkRateLimit, RATE_LIMIT_PRESETS } from '@/lib/rate-limit'
import { logAuditConsole } from '@/lib/audit-log'

// ─── Route classification ──────────────────────────────────
const protectedRoutes = [
  '/api/users',
  '/api/bookings',
  '/api/exams',
  '/api/fraud',
  '/api/courses',
  '/api/payments',
  '/api/exams/candidate',
  '/api/convocation',
]

const adminRoutes = [
  '/api/admin',
  '/api/fraud',
]

// Auth routes that need strict rate limiting
const authRoutes = [
  '/api/auth/login',
  '/api/auth/register',
]

// Payment routes
const paymentRoutes = [
  '/api/payments',
]

// Password reset routes
const passwordResetRoutes = [
  '/api/auth/reset-password',
]

// ─── Determine rate limit config for a route ───────────────
function getRateLimitConfig(pathname: string) {
  if (authRoutes.some(r => pathname.startsWith(r))) {
    return RATE_LIMIT_PRESETS.auth
  }
  if (paymentRoutes.some(r => pathname.startsWith(r))) {
    return RATE_LIMIT_PRESETS.payment
  }
  if (passwordResetRoutes.some(r => pathname.startsWith(r))) {
    return RATE_LIMIT_PRESETS.passwordReset
  }
  if (pathname.startsWith('/api/admin')) {
    return RATE_LIMIT_PRESETS.admin
  }
  if (pathname.startsWith('/api/')) {
    return RATE_LIMIT_PRESETS.general
  }
  return null
}

// ─── Security headers ──────────────────────────────────────
function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: blob: https:; " +
    "font-src 'self' data:; " +
    "connect-src 'self'; " +
    "frame-ancestors 'none'"
  )
  return response
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ─── 1. Add security headers to all responses ────────────
  // ─── 2. Rate limiting check ──────────────────────────────
  const rateLimitConfig = getRateLimitConfig(pathname)
  if (rateLimitConfig) {
    const rateLimitResponse = checkRateLimit(request, rateLimitConfig)
    if (rateLimitResponse) {
      // Log rate limit exceeded
      logAuditConsole({
        eventType: 'RATE_LIMIT_EXCEEDED',
        severity: 'critical',
        description: `Rate limit exceeded for ${pathname}`,
        details: { config: rateLimitConfig.keyPrefix },
      }, request)
      return addSecurityHeaders(rateLimitResponse)
    }
  }

  // ─── 3. CSRF protection for CSRF token endpoint ─────────
  if (pathname === '/api/auth/csrf' && request.method === 'GET') {
    const token = await generateCsrfToken()
    const response = NextResponse.json({ csrfToken: token })
    setCsrfCookie(response, token)
    return addSecurityHeaders(response)
  }

  // ─── 4. CSRF validation for state-changing API requests ──
  if (pathname.startsWith('/api/') && isCsrfRequiredMethod(request.method)) {
    // Skip CSRF for login/register (no session yet, can't have cookie)
    const skipCsrf = authRoutes.some(r => pathname.startsWith(r)) ||
                     pathname === '/api/auth/logout' ||
                     pathname === '/api/auth/reset-password'

    if (!skipCsrf) {
      const csrfError = await validateCsrfRequest(request)
      if (csrfError) {
        logAuditConsole({
          eventType: 'CSRF_VALIDATION_FAILED',
          severity: 'critical',
          description: `CSRF validation failed for ${request.method} ${pathname}`,
        }, request)
        return addSecurityHeaders(csrfError)
      }
    }
  }

  // ─── 5. Authentication check ─────────────────────────────
  const isProtected = protectedRoutes.some(route => pathname.startsWith(route))
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route))

  if (!isProtected && !isAdminRoute) {
    return addSecurityHeaders(NextResponse.next())
  }

  // Verify session token
  const token = request.cookies.get('coderoute_session')?.value

  if (!token) {
    if (pathname.startsWith('/api/')) {
      return addSecurityHeaders(NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      ))
    }
    return addSecurityHeaders(NextResponse.redirect(new URL('/', request.url)))
  }

  const session = await verifyToken(token)

  if (!session) {
    if (pathname.startsWith('/api/')) {
      return addSecurityHeaders(NextResponse.json(
        { error: 'Session expirée. Veuillez vous reconnecter.' },
        { status: 401 }
      ))
    }
    return addSecurityHeaders(NextResponse.redirect(new URL('/', request.url)))
  }

  // ─── 6. Admin role check ─────────────────────────────────
  if (isAdminRoute) {
    if (session.role !== 'administration' && session.role !== 'super-admin') {
      logAuditConsole({
        eventType: 'ADMIN_ACTION',
        severity: 'warning',
        userId: session.userId,
        userRole: session.role,
        description: `Non-admin attempted access to ${pathname}`,
      }, request)
      return addSecurityHeaders(NextResponse.json(
        { error: 'Accès réservé aux administrateurs' },
        { status: 403 }
      ))
    }
  }

  // ─── 7. Add session info to request headers for downstream use ──
  const response = NextResponse.next()
  response.headers.set('x-user-id', session.userId)
  response.headers.set('x-user-role', session.role)

  return addSecurityHeaders(response)
}

export const config = {
  matcher: [
    '/api/:path*',
  ],
}
