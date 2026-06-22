// ============================================================
// CodeRoute Guinée — Orange SMS Admin API (Phase 29)
// ============================================================
// GET  /api/admin/notifications/orange-sms           — Configuration status
// POST /api/admin/notifications/orange-sms           — Send a test SMS
//        Body: { phone: "+224628123456" }
//
// Restricted to super-admin & administration roles.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import {
  getOrangeSmsConfig,
  isOrangeSmsConfigured,
  sendTestOrangeSms,
  normalizeGuineaPhone,
} from '@/lib/orange-sms'

function isAdmin(session: any): boolean {
  return session && (session.role === 'super-admin' || session.role === 'administration')
}

// ─── GET: Configuration status ───────────────────────────
export async function GET() {
  try {
    const session = await getSession()
    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 })
    }

    const configured = isOrangeSmsConfigured()
    const config = getOrangeSmsConfig()

    // Don't leak secrets — only show masked identifiers
    return NextResponse.json({
      configured,
      provider: configured ? 'orange' : 'console',
      apiBase: config?.apiBase ?? 'https://api.orange.com',
      senderAddress: config?.senderAddress ?? null,
      clientIdMasked: config
        ? `${config.clientId.slice(0, 4)}••••${config.clientId.slice(-4)}`
        : null,
      help: configured
        ? 'Orange SMS OAuth2 est configuré. Vous pouvez envoyer un SMS de test.'
        : 'Variables d\'environnement Orange SMS manquantes. Configurez ORANGE_SMS_CLIENT_ID, ORANGE_SMS_CLIENT_SECRET, ORANGE_SMS_SENDER_ADDRESS dans .env pour activer l\'envoi réel.',
      envVars: {
        ORANGE_SMS_CLIENT_ID: !!process.env.ORANGE_SMS_CLIENT_ID,
        ORANGE_SMS_CLIENT_SECRET: !!process.env.ORANGE_SMS_CLIENT_SECRET,
        ORANGE_SMS_SENDER_ADDRESS: !!process.env.ORANGE_SMS_SENDER_ADDRESS,
        ORANGE_SMS_API_BASE: !!process.env.ORANGE_SMS_API_BASE,
      },
    })
  } catch (error) {
    console.error('[ORANGE_SMS_STATUS_ERROR]', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}

// ─── POST: Send a test SMS ───────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const { phone } = body

    if (!phone || typeof phone !== 'string') {
      return NextResponse.json({ error: 'Numéro de téléphone requis' }, { status: 400 })
    }

    // Validate phone format early (gives a clean error before any API call)
    let normalized: string
    try {
      normalized = normalizeGuineaPhone(phone)
    } catch (err: any) {
      return NextResponse.json({
        error: err.message,
        received: phone,
      }, { status: 400 })
    }

    const result = await sendTestOrangeSms(phone)

    return NextResponse.json({
      success: result.success,
      provider: result.provider,
      messageId: result.messageId,
      error: result.error,
      remainingQuota: result.remainingQuota,
      normalizedPhone: normalized,
      diagnostic: result.diagnostic,
      message: result.success
        ? result.provider === 'orange'
          ? `SMS Orange envoyé à ${normalized}. ID: ${result.messageId ?? 'N/A'}`
          : `SMS simulé (mode console) — pas d'envoi réel. Destinataire: ${normalized}`
        : `Échec d'envoi: ${result.error ?? 'erreur inconnue'}`,
    })
  } catch (error) {
    console.error('[ORANGE_SMS_TEST_ERROR]', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
