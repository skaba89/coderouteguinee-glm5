import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/session'

// Routes that require authentication
const protectedRoutes = [
  '/api/users',
  '/api/bookings',
  '/api/exams',
  '/api/fraud',
  '/api/courses',
  '/api/payments',
  '/api/exams/candidate',
]

// Routes that require admin role (administration or super-admin)
const adminRoutes = [
  '/api/admin',
  '/api/fraud',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip non-protected routes
  const isProtected = protectedRoutes.some(route => pathname.startsWith(route))
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route))

  if (!isProtected && !isAdminRoute) {
    return NextResponse.next()
  }

  // Verify session token
  const token = request.cookies.get('coderoute_session')?.value

  if (!token) {
    // For API routes, return 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      )
    }
    // For pages, redirect to landing
    return NextResponse.redirect(new URL('/', request.url))
  }

  const session = await verifyToken(token)

  if (!session) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Session expirée. Veuillez vous reconnecter.' },
        { status: 401 }
      )
    }
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Check admin routes
  if (isAdminRoute) {
    if (session.role !== 'administration' && session.role !== 'super-admin') {
      return NextResponse.json(
        { error: 'Accès réservé aux administrateurs' },
        { status: 403 }
      )
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/api/users/:path*',
    '/api/bookings/:path*',
    '/api/exams/:path*',
    '/api/fraud/:path*',
    '/api/admin/:path*',
    '/api/payments/:path*',
  ],
}
