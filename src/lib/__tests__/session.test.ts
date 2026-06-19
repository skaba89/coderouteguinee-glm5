// ============================================================
// Tests unitaires — Gestion de session (JWT + cookies httpOnly)
// ============================================================

import {
  createSession,
  verifyToken,
  setSessionCookie,
  clearSessionCookie,
  getSessionFromRequest,
  requireAuth,
  requireAdmin,
  type SessionPayload,
} from '../session'
import { NextRequest, NextResponse } from 'next/server'

// ─── Données de session de test ─────────────────────────────
const PAYLOAD: SessionPayload = {
  userId: 'user-uuid-1',
  email: 'candidat@example.com',
  role: 'candidat',
  numeroUnique: 'GN-CODE-2024-000001',
  nom: 'Diallo',
  prenom: 'Aissata',
}

// Helper : instancier une NextResponse pour inspecter les cookies
function buildResponse(): NextResponse {
  return new NextResponse(null, { status: 200 })
}

// Helper : construire une NextRequest avec un cookie donné
function buildRequest(cookieValue?: string): NextRequest {
  const url = 'https://app.test/api/route'
  const req = new NextRequest(url, { method: 'GET' })
  if (cookieValue) {
    req.cookies.set('coderoute_session', cookieValue)
  }
  return req
}

// ─── Note : `cookies()` de `next/headers` est mocké globalement par jest.setup.ts
//    et retourne un cookie vide. Les tests qui dépendent de `getSession()` ne sont
//    donc pas inclus ici — on teste `getSessionFromRequest` à la place, qui prend
//    la requête en paramètre explicite.

describe('Session Management', () => {
  describe('createSession', () => {
    test('génère un token JWT non vide', async () => {
      const token = await createSession(PAYLOAD)
      expect(typeof token).toBe('string')
      expect(token.length).toBeGreaterThan(50)
    })

    test('produit un token JWT valide (3 segments séparés par ".")', async () => {
      const token = await createSession(PAYLOAD)
      const parts = token.split('.')
      expect(parts).toHaveLength(3) // header.payload.signature
    })

    test('génère des tokens différents pour des payloads différents', async () => {
      const t1 = await createSession(PAYLOAD)
      const t2 = await createSession({ ...PAYLOAD, userId: 'user-uuid-2' })
      expect(t1).not.toBe(t2)
    })

    test('génère des tokens différents pour le même payload (iat aléatoire)', async () => {
      const t1 = await createSession(PAYLOAD)
      // Petit délai pour s'assurer que le iat change
      await new Promise((r) => setTimeout(r, 1100))
      const t2 = await createSession(PAYLOAD)
      expect(t1).not.toBe(t2)
    })

    test('inclut tous les champs du payload dans le token décodable', async () => {
      const token = await createSession(PAYLOAD)
      // Décode le payload sans vérifier la signature pour inspection
      const [, payloadB64] = token.split('.')
      const payloadJson = Buffer.from(payloadB64, 'base64url').toString('utf8')
      const decoded = JSON.parse(payloadJson)
      expect(decoded.userId).toBe(PAYLOAD.userId)
      expect(decoded.email).toBe(PAYLOAD.email)
      expect(decoded.role).toBe(PAYLOAD.role)
      expect(decoded.numeroUnique).toBe(PAYLOAD.numeroUnique)
      expect(decoded.nom).toBe(PAYLOAD.nom)
      expect(decoded.prenom).toBe(PAYLOAD.prenom)
    })

    test('définit une expiration (~24h après émission)', async () => {
      const token = await createSession(PAYLOAD)
      const [, payloadB64] = token.split('.')
      const decoded = JSON.parse(
        Buffer.from(payloadB64, 'base64url').toString('utf8')
      )
      expect(decoded.exp).toBeDefined()
      expect(decoded.iat).toBeDefined()
      // exp - iat ~= 24h (à 5 minutes près pour la tolérance de test)
      const diffSeconds = decoded.exp - decoded.iat
      expect(diffSeconds).toBeGreaterThanOrEqual(24 * 3600 - 300)
      expect(diffSeconds).toBeLessThanOrEqual(24 * 3600 + 300)
    })
  })

  describe('verifyToken', () => {
    test('valide un token fraîchement créé', async () => {
      const token = await createSession(PAYLOAD)
      const result = await verifyToken(token)
      expect(result).not.toBeNull()
      expect(result?.userId).toBe(PAYLOAD.userId)
      expect(result?.email).toBe(PAYLOAD.email)
      expect(result?.role).toBe(PAYLOAD.role)
      expect(result?.numeroUnique).toBe(PAYLOAD.numeroUnique)
    })

    test('rejette un token invalide (retourne null)', async () => {
      const result = await verifyToken('not.a.valid.jwt')
      expect(result).toBeNull()
    })

    test('rejette un token vide', async () => {
      const result = await verifyToken('')
      expect(result).toBeNull()
    })

    test('rejette un token avec une signature falsifiée', async () => {
      const token = await createSession(PAYLOAD)
      // Modifier le dernier caractère de la signature
      const parts = token.split('.')
      const tamperedSig =
        parts[2].slice(0, -1) +
        (parts[2].endsWith('A') ? 'B' : 'A')
      const tamperedToken = `${parts[0]}.${parts[1]}.${tamperedSig}`
      const result = await verifyToken(tamperedToken)
      expect(result).toBeNull()
    })

    test('rejette un token tronqué', async () => {
      const token = await createSession(PAYLOAD)
      const result = await verifyToken(token.slice(0, -20))
      expect(result).toBeNull()
    })
  })

  describe('setSessionCookie', () => {
    test('définit le cookie "coderoute_session" avec les bons flags', () => {
      const res = buildResponse()
      setSessionCookie(res, 'fake-jwt-token')
      const setCookie = res.headers.get('set-cookie') || ''
      expect(setCookie).toBeTruthy()
      expect(setCookie).toContain('coderoute_session=fake-jwt-token')
      expect(setCookie).toContain('HttpOnly')
      // Next/Node rend SameSite en minuscules
      expect(setCookie.toLowerCase()).toContain('samesite=lax')
      expect(setCookie).toContain('Path=/')
      expect(setCookie).toContain('Max-Age=86400') // 24h
    })

    test('marque le cookie Secure uniquement en production', () => {
      const originalEnv = process.env.NODE_ENV
      try {
        // En production
        Object.defineProperty(process.env, 'NODE_ENV', {
          value: 'production',
          writable: true,
          configurable: true,
        })
        const resProd = buildResponse()
        setSessionCookie(resProd, 'tok')
        expect(resProd.headers.get('set-cookie')).toContain('Secure')

        // En développement
        Object.defineProperty(process.env, 'NODE_ENV', {
          value: 'development',
          writable: true,
          configurable: true,
        })
        const resDev = buildResponse()
        setSessionCookie(resDev, 'tok')
        expect(resDev.headers.get('set-cookie')).not.toContain('Secure')
      } finally {
        Object.defineProperty(process.env, 'NODE_ENV', {
          value: originalEnv,
          writable: true,
          configurable: true,
        })
      }
    })

    test('peut être appelé plusieurs fois (dernière valeur gagne)', () => {
      const res = buildResponse()
      setSessionCookie(res, 'first')
      setSessionCookie(res, 'second')
      const setCookie = res.headers.get('set-cookie') || ''
      // NextResponse écrase la précédente valeur — la dernière doit apparaître
      expect(setCookie).toContain('coderoute_session=second')
    })
  })

  describe('clearSessionCookie', () => {
    test('définit le cookie avec une valeur vide et Max-Age=0', () => {
      const res = buildResponse()
      clearSessionCookie(res)
      const setCookie = res.headers.get('set-cookie') || ''
      expect(setCookie).toContain('coderoute_session=')
      expect(setCookie).toContain('Max-Age=0')
      expect(setCookie).toContain('HttpOnly')
      expect(setCookie).toContain('Path=/')
    })

    test('marque Secure en production', () => {
      const originalEnv = process.env.NODE_ENV
      try {
        Object.defineProperty(process.env, 'NODE_ENV', {
          value: 'production',
          writable: true,
          configurable: true,
        })
        const res = buildResponse()
        clearSessionCookie(res)
        expect(res.headers.get('set-cookie')).toContain('Secure')
      } finally {
        Object.defineProperty(process.env, 'NODE_ENV', {
          value: originalEnv,
          writable: true,
          configurable: true,
        })
      }
    })
  })

  describe('getSessionFromRequest', () => {
    test('retourne le payload si le cookie est valide', async () => {
      const token = await createSession(PAYLOAD)
      const req = buildRequest(token)
      const session = await getSessionFromRequest(req)
      expect(session).not.toBeNull()
      expect(session?.userId).toBe(PAYLOAD.userId)
      expect(session?.email).toBe(PAYLOAD.email)
    })

    test('retourne null si aucun cookie de session présent', async () => {
      const req = buildRequest(undefined)
      const session = await getSessionFromRequest(req)
      expect(session).toBeNull()
    })

    test('retourne null si le cookie est invalide', async () => {
      const req = buildRequest('invalid.token.value')
      const session = await getSessionFromRequest(req)
      expect(session).toBeNull()
    })

    test('retourne null si le cookie est vide', async () => {
      const req = buildRequest('')
      const session = await getSessionFromRequest(req)
      expect(session).toBeNull()
    })
  })

  describe('requireAuth', () => {
    test('retourne null (mock next/headers retourne cookie vide)', async () => {
      const session = await requireAuth()
      expect(session).toBeNull()
    })
  })

  describe('requireAdmin', () => {
    test('retourne null car aucune session active dans le mock', async () => {
      const session = await requireAdmin()
      expect(session).toBeNull()
    })

    test('rejette les rôles non-admin quand une session existe', async () => {
      // Le mock global de `cookies()` ne permet pas de retourner un token valide.
      // On valide donc indirectement : si requireAdmin retourne null avec un mock
      // qui simule un cookie candidat valide, c'est que le contrôle de rôle marche.
      const { cookies } = await import('next/headers')
      const token = await createSession(PAYLOAD) // role = 'candidat'

      // Remplace le mock par un cookie valide candidat
      ;(cookies as unknown as jest.Mock).mockResolvedValueOnce({
        get: (name: string) =>
          name === 'coderoute_session' ? { value: token } : undefined,
        set: jest.fn(),
        delete: jest.fn(),
      })

      const session = await requireAdmin()
      expect(session).toBeNull() // rejeté car 'candidat' n'est pas admin
    })

    test('accepte le rôle "administration"', async () => {
      const { cookies } = await import('next/headers')
      const adminPayload: SessionPayload = { ...PAYLOAD, role: 'administration' }
      const token = await createSession(adminPayload)

      ;(cookies as unknown as jest.Mock).mockResolvedValueOnce({
        get: (name: string) =>
          name === 'coderoute_session' ? { value: token } : undefined,
        set: jest.fn(),
        delete: jest.fn(),
      })

      const session = await requireAdmin()
      expect(session).not.toBeNull()
      expect(session?.role).toBe('administration')
    })

    test('accepte le rôle "super-admin"', async () => {
      const { cookies } = await import('next/headers')
      const adminPayload: SessionPayload = { ...PAYLOAD, role: 'super-admin' }
      const token = await createSession(adminPayload)

      ;(cookies as unknown as jest.Mock).mockResolvedValueOnce({
        get: (name: string) =>
          name === 'coderoute_session' ? { value: token } : undefined,
        set: jest.fn(),
        delete: jest.fn(),
      })

      const session = await requireAdmin()
      expect(session).not.toBeNull()
      expect(session?.role).toBe('super-admin')
    })
  })
})
