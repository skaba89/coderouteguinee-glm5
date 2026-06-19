// ============================================================
// CodeRoute Guinée — Admin Notifications: Test & Status API
// GET  /api/admin/notifications/status — Current config + counters
// POST /api/admin/notifications/status — Send a test notification
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'
import { sendNotification } from '@/lib/notifications'

// ─── GET: Configuration status & counters ────────────────
export async function GET() {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'super-admin' && session.role !== 'administration')) {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 })
    }

    const emailConfigured = !!process.env.SMTP_HOST
    const emailApiConfigured = !!process.env.EMAIL_API_URL
    const smsProvider = process.env.SMS_PROVIDER || 'console'
    const smsConfigured = smsProvider !== 'console' && !!process.env.SMS_API_KEY

    const [totalSent, totalFailed, last24h] = await Promise.all([
      db.notificationLog.count({ where: { status: 'sent' } }),
      db.notificationLog.count({ where: { status: 'failed' } }),
      db.notificationLog.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
    ])

    const byTemplate = await db.notificationLog.groupBy({
      by: ['template'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    })

    return NextResponse.json({
      config: {
        email: {
          configured: emailConfigured || emailApiConfigured,
          mode: emailConfigured ? 'smtp' : emailApiConfigured ? 'http-api' : 'console (fallback)',
          host: process.env.SMTP_HOST || null,
          from: process.env.SMTP_FROM_EMAIL || 'noreply@coderoute-gn.org',
        },
        sms: {
          configured: smsConfigured,
          provider: smsProvider,
          senderId: process.env.SMS_SENDER_ID || 'CodeRoute',
        },
      },
      stats: {
        totalSent,
        totalFailed,
        last24h,
        byTemplate: byTemplate.map(t => ({ template: t.template, count: t._count.id })),
      },
    })
  } catch (error) {
    console.error('[NOTIFICATIONS_STATUS_ERROR]', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}

// ─── POST: Send a test notification ──────────────────────
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'super-admin' && session.role !== 'administration')) {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 })
    }

    const body = await request.json()
    const { channel, recipient } = body

    if (!channel || !['email', 'sms'].includes(channel)) {
      return NextResponse.json({ error: 'Canal invalide (email ou sms)' }, { status: 400 })
    }
    if (!recipient) {
      return NextResponse.json({ error: 'Destinataire requis' }, { status: 400 })
    }

    const result = await sendNotification({
      userId: session.userId,
      channel,
      template: 'welcome',
      recipient,
      variables: {
        prenom: 'Admin',
        nom: 'Test',
        numeroUnique: 'TEST-' + Date.now(),
        email: recipient,
      },
    })

    return NextResponse.json({
      success: result.success,
      error: result.error,
      message: result.success
        ? `Notification ${channel} envoyée à ${recipient} (vérifiez les logs serveur si mode console)`
        : `Échec d'envoi: ${result.error || 'erreur inconnue'}`,
    })
  } catch (error) {
    console.error('[NOTIFICATIONS_TEST_ERROR]', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
