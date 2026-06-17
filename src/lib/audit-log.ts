// ============================================================
// CodeRoute Guinée — Audit Logging
// Tracks all significant actions for accountability and security
// ============================================================

import { NextRequest } from 'next/server'
import { db } from '@/lib/db'

// ─── Audit event types ─────────────────────────────────────
export type AuditEventType =
  | 'AUTH_LOGIN'
  | 'AUTH_LOGIN_FAILED'
  | 'AUTH_LOGOUT'
  | 'AUTH_REGISTER'
  | 'AUTH_PASSWORD_RESET_REQUEST'
  | 'AUTH_PASSWORD_RESET_COMPLETE'
  | 'AUTH_PASSWORD_CHANGE'
  | 'USER_CREATE'
  | 'USER_UPDATE'
  | 'USER_DEACTIVATE'
  | 'USER_REACTIVATE'
  | 'USER_ROLE_CHANGE'
  | 'CENTRE_UPDATE'
  | 'CENTRE_SUSPEND'
  | 'CENTRE_REACTIVATE'
  | 'BOOKING_CREATE'
  | 'BOOKING_CONFIRM'
  | 'BOOKING_REJECT'
  | 'PAYMENT_INITIATE'
  | 'PAYMENT_CONFIRM'
  | 'PAYMENT_FAIL'
  | 'EXAM_START'
  | 'EXAM_COMPLETE'
  | 'FRAUD_INVESTIGATE'
  | 'FRAUD_RESOLVE'
  | 'FRAUD_DISMISS'
  | 'QUESTION_CREATE'
  | 'QUESTION_UPDATE'
  | 'ADMIN_ACTION'
  | 'RATE_LIMIT_EXCEEDED'
  | 'CSRF_VALIDATION_FAILED'
  | 'DATA_EXPORT'

export type AuditSeverity = 'info' | 'warning' | 'critical'

// ─── Audit log entry interface ─────────────────────────────
export interface AuditLogEntry {
  eventType: AuditEventType
  severity?: AuditSeverity
  userId?: string
  userRole?: string
  targetId?: string
  targetType?: string
  description: string
  details?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

// ─── Extract request metadata ──────────────────────────────
function getRequestMeta(request?: NextRequest) {
  if (!request) return { ipAddress: undefined, userAgent: undefined }

  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || undefined
  const ua = request.headers.get('user-agent') || undefined

  return { ipAddress: ip, userAgent: ua }
}

// ─── Write audit log entry ─────────────────────────────────
export async function logAudit(
  entry: AuditLogEntry,
  request?: NextRequest
): Promise<void> {
  try {
    const requestMeta = getRequestMeta(request)
    const severity = entry.severity || getDefaultSeverity(entry.eventType)

    // Use Prisma model to write audit log
    await db.auditLog.create({
      data: {
        eventType: entry.eventType,
        severity,
        userId: entry.userId || null,
        userRole: entry.userRole || null,
        targetId: entry.targetId || null,
        targetType: entry.targetType || null,
        description: entry.description,
        details: entry.details ? JSON.stringify(entry.details) : null,
        ipAddress: requestMeta.ipAddress || null,
        userAgent: requestMeta.userAgent || null,
      },
    })
  } catch (error) {
    // Audit logging should never break the application
    console.error('[AUDIT LOG ERROR]', error)
    console.log('[AUDIT FALLBACK]', JSON.stringify({
      timestamp: new Date().toISOString(),
      ...entry,
    }))
  }
}

// ─── Console-only audit log (for middleware / pre-DB contexts) ──
export function logAuditConsole(
  entry: AuditLogEntry,
  request?: NextRequest
): void {
  const requestMeta = getRequestMeta(request)
  const severity = entry.severity || getDefaultSeverity(entry.eventType)

  const logData = {
    timestamp: new Date().toISOString(),
    ...entry,
    severity,
    ...requestMeta,
  }

  if (severity === 'critical') {
    console.error('[AUDIT CRITICAL]', JSON.stringify(logData))
  } else if (severity === 'warning') {
    console.warn('[AUDIT WARNING]', JSON.stringify(logData))
  } else {
    console.log('[AUDIT]', JSON.stringify(logData))
  }
}

// ─── Default severity mapping ──────────────────────────────
function getDefaultSeverity(eventType: AuditEventType): AuditSeverity {
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

  if (criticalEvents.includes(eventType)) return 'critical'
  if (warningEvents.includes(eventType)) return 'warning'
  return 'info'
}

// ─── Query audit logs (for admin dashboard) ────────────────
export interface AuditLogQuery {
  eventType?: AuditEventType
  userId?: string
  targetId?: string
  severity?: AuditSeverity
  startDate?: string
  endDate?: string
  limit?: number
  offset?: number
}

export async function queryAuditLogs(query: AuditLogQuery = {}) {
  const { eventType, userId, targetId, severity, startDate, endDate, limit = 50, offset = 0 } = query

  const where: Record<string, unknown> = {}
  if (eventType) where.eventType = eventType
  if (userId) where.userId = userId
  if (targetId) where.targetId = targetId
  if (severity) where.severity = severity
  if (startDate || endDate) {
    where.timestamp = {
      ...(startDate ? { gte: new Date(startDate) } : {}),
      ...(endDate ? { lte: new Date(endDate) } : {}),
    }
  }

  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
    }),
    db.auditLog.count({ where }),
  ])

  return {
    logs,
    total,
    limit,
    offset,
  }
}
