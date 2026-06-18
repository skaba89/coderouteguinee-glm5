// ============================================================
// Tests unitaires — Audit Logging
// Vérifie la sévérité par défaut, le rendu console, l'écriture
// en base et la récupération sur erreur DB.
// ============================================================

import { logAudit, logAuditConsole, queryAuditLogs, type AuditEventType } from '../audit-log'
import { db } from '@/lib/db'

// ─── Mock Prisma db ────────────────────────────────────────
jest.mock('@/lib/db', () => ({
  db: {
    auditLog: {
      create: jest.fn().mockResolvedValue({ id: 'log-1' }),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    },
  },
}))

// ─── Helpers ───────────────────────────────────────────────
function mockRequest(headers: Record<string, string> = {}) {
  return {
    headers: new Headers(headers),
  } as any
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('Audit Logging', () => {
  describe('getDefaultSeverity (via logAudit)', () => {
    const criticalEvents: AuditEventType[] = [
      'AUTH_LOGIN_FAILED',
      'FRAUD_INVESTIGATE',
      'FRAUD_RESOLVE',
      'CSRF_VALIDATION_FAILED',
      'RATE_LIMIT_EXCEEDED',
      'USER_DEACTIVATE',
      'CENTRE_SUSPEND',
    ]
    const warningEvents: AuditEventType[] = [
      'AUTH_PASSWORD_RESET_REQUEST',
      'USER_ROLE_CHANGE',
      'BOOKING_REJECT',
      'PAYMENT_FAIL',
      'DATA_EXPORT',
    ]
    const infoEvents: AuditEventType[] = [
      'AUTH_LOGIN',
      'AUTH_LOGOUT',
      'AUTH_REGISTER',
      'BOOKING_CREATE',
      'BOOKING_CONFIRM',
      'EXAM_COMPLETE',
    ]

    test.each(criticalEvents)('marque %s comme critical', async (eventType) => {
      await logAudit({ eventType, description: 'test' })
      const call = db.auditLog.create.mock.calls[0][0]
      expect(call.data.severity).toBe('critical')
    })

    test.each(warningEvents)('marque %s comme warning', async (eventType) => {
      await logAudit({ eventType, description: 'test' })
      const call = db.auditLog.create.mock.calls[0][0]
      expect(call.data.severity).toBe('warning')
    })

    test.each(infoEvents)('marque %s comme info', async (eventType) => {
      await logAudit({ eventType, description: 'test' })
      const call = db.auditLog.create.mock.calls[0][0]
      expect(call.data.severity).toBe('info')
    })

    test('respecte la sévérité explicite si fournie', async () => {
      await logAudit({
        eventType: 'AUTH_LOGIN',
        severity: 'critical',
        description: 'login manuel critique',
      })
      const call = db.auditLog.create.mock.calls[0][0]
      expect(call.data.severity).toBe('critical')
    })
  })

  describe('logAudit — écriture en base', () => {
    test('enregistre tous les champs fournis', async () => {
      await logAudit({
        eventType: 'USER_UPDATE',
        description: 'Role changé',
        userId: 'u-1',
        userRole: 'super-admin',
        targetId: 'u-2',
        targetType: 'User',
        details: { from: 'candidat', to: 'administration' },
      }, mockRequest({ 'x-forwarded-for': '10.0.0.1', 'user-agent': 'Jest/1.0' }))

      const call = db.auditLog.create.mock.calls[0][0]
      expect(call.data.eventType).toBe('USER_UPDATE')
      expect(call.data.userId).toBe('u-1')
      expect(call.data.userRole).toBe('super-admin')
      expect(call.data.targetId).toBe('u-2')
      expect(call.data.targetType).toBe('User')
      expect(call.data.description).toBe('Role changé')
      expect(call.data.details).toContain('from')
      expect(call.data.details).toContain('administration')
      expect(call.data.ipAddress).toBe('10.0.0.1')
      expect(call.data.userAgent).toBe('Jest/1.0')
    })

    test('utilise x-real-ip si pas de x-forwarded-for', async () => {
      await logAudit(
        { eventType: 'AUTH_LOGIN', description: 'login' },
        mockRequest({ 'x-real-ip': '192.168.0.1' })
      )
      const call = db.auditLog.create.mock.calls[0][0]
      expect(call.data.ipAddress).toBe('192.168.0.1')
    })

    test('met userId à null si non fourni', async () => {
      await logAudit({ eventType: 'AUTH_LOGIN_FAILED', description: 'no user' })
      const call = db.auditLog.create.mock.calls[0][0]
      expect(call.data.userId).toBeNull()
      expect(call.data.userRole).toBeNull()
      expect(call.data.targetId).toBeNull()
      expect(call.data.targetType).toBeNull()
      expect(call.data.details).toBeNull()
      expect(call.data.ipAddress).toBeNull()
      expect(call.data.userAgent).toBeNull()
    })

    test('sérialise details en JSON string', async () => {
      await logAudit({
        eventType: 'BOOKING_CONFIRM',
        description: 'Confirmée',
        details: { bookingId: 'b-1', amount: 75000 },
      })
      const call = db.auditLog.create.mock.calls[0][0]
      expect(typeof call.data.details).toBe('string')
      const parsed = JSON.parse(call.data.details)
      expect(parsed).toEqual({ bookingId: 'b-1', amount: 75000 })
    })

    test('survit à une erreur DB (n\'interrompt pas l\'app)', async () => {
      db.auditLog.create.mockRejectedValueOnce(new Error('DB down'))
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {})

      // Ne doit pas jeter
      await expect(
        logAudit({ eventType: 'AUTH_LOGIN', description: 'test' })
      ).resolves.toBeUndefined()

      expect(errorSpy).toHaveBeenCalled()
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('[AUDIT FALLBACK]'),
        expect.any(String)
      )
      errorSpy.mockRestore()
      logSpy.mockRestore()
    })
  })

  describe('logAuditConsole', () => {
    test('utilise console.error pour critical', () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      logAuditConsole({ eventType: 'AUTH_LOGIN_FAILED', description: 'fail' })
      expect(errorSpy).toHaveBeenCalledWith(
        '[AUDIT CRITICAL]',
        expect.stringContaining('AUTH_LOGIN_FAILED')
      )
      errorSpy.mockRestore()
    })

    test('utilise console.warn pour warning', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
      logAuditConsole({ eventType: 'PAYMENT_FAIL', description: 'fail' })
      expect(warnSpy).toHaveBeenCalledWith(
        '[AUDIT WARNING]',
        expect.stringContaining('PAYMENT_FAIL')
      )
      warnSpy.mockRestore()
    })

    test('utilise console.log pour info', () => {
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
      logAuditConsole({ eventType: 'AUTH_LOGIN', description: 'ok' })
      expect(logSpy).toHaveBeenCalledWith(
        '[AUDIT]',
        expect.stringContaining('AUTH_LOGIN')
      )
      logSpy.mockRestore()
    })

    test('inclut le timestamp et les méta de requête', () => {
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
      logAuditConsole(
        { eventType: 'BOOKING_CREATE', description: 'nouvelle réservation' },
        mockRequest({ 'x-forwarded-for': '10.0.0.99' })
      )
      const json = logSpy.mock.calls[0][1]
      const parsed = JSON.parse(json)
      expect(parsed.timestamp).toBeDefined()
      expect(parsed.ipAddress).toBe('10.0.0.99')
      expect(parsed.description).toContain('réservation')
      logSpy.mockRestore()
    })
  })

  describe('queryAuditLogs', () => {
    test('utilise les valeurs par défaut (limit 50, offset 0)', async () => {
      await queryAuditLogs()
      expect(db.auditLog.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { timestamp: 'desc' },
        take: 50,
        skip: 0,
      })
      expect(db.auditLog.count).toHaveBeenCalledWith({ where: {} })
    })

    test('construit le filtre where correctement', async () => {
      await queryAuditLogs({
        eventType: 'AUTH_LOGIN',
        userId: 'u-1',
        severity: 'info',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        limit: 10,
        offset: 5,
      })

      const where = db.auditLog.findMany.mock.calls[0][0].where
      expect(where.eventType).toBe('AUTH_LOGIN')
      expect(where.userId).toBe('u-1')
      expect(where.severity).toBe('info')
      expect(where.timestamp).toEqual({
        gte: new Date('2026-01-01'),
        lte: new Date('2026-12-31'),
      })

      expect(db.auditLog.findMany.mock.calls[0][0].take).toBe(10)
      expect(db.auditLog.findMany.mock.calls[0][0].skip).toBe(5)
    })

    test('omet le filtre timestamp si pas de dates', async () => {
      await queryAuditLogs({ eventType: 'AUTH_LOGOUT' })
      const where = db.auditLog.findMany.mock.calls[0][0].where
      expect(where.timestamp).toBeUndefined()
    })

    test('renvoie logs, total, limit, offset', async () => {
      db.auditLog.findMany.mockResolvedValueOnce([{ id: 'a' }, { id: 'b' }])
      db.auditLog.count.mockResolvedValueOnce(2)

      const result = await queryAuditLogs({ limit: 5 })
      expect(result).toEqual({
        logs: [{ id: 'a' }, { id: 'b' }],
        total: 2,
        limit: 5,
        offset: 0,
      })
    })
  })
})
