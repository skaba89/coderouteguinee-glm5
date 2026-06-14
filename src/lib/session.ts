// ============================================================
// CodeRoute Guinée — Secure Session Management (JWT + httpOnly cookies)
// Uses jose for Edge-compatible JWT signing/verification
// ============================================================

import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// Session secret — in production, use a strong env variable
const SESSION_SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'coderoute-guinee-session-secret-2024-change-in-production'
);

const SESSION_COOKIE_NAME = 'coderoute_session';
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
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION,
    path: '/',
  });
}

// ─── Clear session cookie on logout ────────────────────────
export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
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
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

// ─── Get session from a request (middleware/API route) ─────
export function getSessionFromRequest(request: NextRequest): Promise<SessionPayload | null> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
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
