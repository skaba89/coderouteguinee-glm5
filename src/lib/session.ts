// ============================================================
// CodeRoute Guinée — Secure Session Management (JWT + httpOnly cookies)
// Uses jose for Edge-compatible JWT signing/verification
// ============================================================

import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// Session secret — must be set via env var in production.
// In development OR during `next build` (which evaluates modules
// with NODE_ENV=production), we fall back to a random dev secret
// and log a warning. The actual production runtime check is done
// in instrumentation.ts at server boot.
const FALLBACK_DEV_SECRET = 'dev-only-DO-NOT-USE-IN-PRODUCTION-' + Math.random().toString(36).slice(2)
const isBuildPhase = !!process.env.NEXT_BUILDING || process.env.NEXT_PHASE === 'phase-production-build'
const SESSION_SECRET_STR =
  process.env.SESSION_SECRET ||
  (process.env.NODE_ENV === 'production' && !isBuildPhase
    ? (() => { throw new Error('SESSION_SECRET must be set in production. Generate with: openssl rand -hex 32') })()
    : FALLBACK_DEV_SECRET)

if (!process.env.SESSION_SECRET && (process.env.NODE_ENV !== 'production' || isBuildPhase)) {
  console.warn('⚠ SESSION_SECRET not set — using random dev-only secret. Sessions will not persist across restarts.')
}

const SESSION_SECRET = new TextEncoder().encode(SESSION_SECRET_STR);

// Cookie name: use __Host- prefix in production for extra security.
// __Host- prefix requires: Secure, path=/, no Domain attribute.
// See: https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies#cookie_prefixes
function isProd() {
  return process.env.NODE_ENV === 'production'
}
function getSessionCookieName() {
  return isProd() ? '__Host-coderoute_session' : 'coderoute_session'
}
const SESSION_DURATION = 24 * 60 * 60; // 24 hours in seconds

export interface SessionPayload {
  userId: string;
  email: string;
  role: string;
  numeroUnique: string;
  nom: string;
  prenom: string;
}

// ─── Sign a new JWT and set it as an httpOnly cookie ───────
export async function createSession(payload: SessionPayload): Promise<string> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION}s`)
    .sign(SESSION_SECRET);

  return token;
}

// ─── Set session cookie on a response ──────────────────────
export function setSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set(getSessionCookieName(), token, {
    httpOnly: true,
    secure: isProd(),
    // 'strict' would break login links from emails, 'lax' is the safe default.
    sameSite: 'lax',
    maxAge: SESSION_DURATION,
    path: '/',
    // No `domain` — required for __Host- prefix in production.
  });
}

// ─── Clear session cookie on logout ────────────────────────
export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(getSessionCookieName(), '', {
    httpOnly: true,
    secure: isProd(),
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
}

// ─── Verify a JWT token ────────────────────────────────────
export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SESSION_SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

// ─── Get current session from cookies (server-side) ────────
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(getSessionCookieName())?.value;
  if (!token) return null;
  return verifyToken(token);
}

// ─── Get session from a request (middleware/API route) ─────
export function getSessionFromRequest(request: NextRequest): Promise<SessionPayload | null> {
  const token = request.cookies.get(getSessionCookieName())?.value;
  if (!token) return Promise.resolve(null);
  return verifyToken(token);
}

// ─── Require authentication — returns session or null ──────
export async function requireAuth(): Promise<SessionPayload | null> {
  return getSession();
}

// ─── Require admin role — returns session or null ──────────
export async function requireAdmin(): Promise<SessionPayload | null> {
  const session = await getSession();
  if (!session) return null;
  if (session.role !== 'administration' && session.role !== 'super-admin') return null;
  return session;
}
