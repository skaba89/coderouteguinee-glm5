// ============================================================
// CodeRoute Guinée — 2FA Verification Endpoint
// POST /api/auth/2fa/verify — Verify TOTP code and enable 2FA
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { enableTwoFactor } from '@/lib/two-factor'
import { logAudit } from '@/lib/audit-log'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Authentification requise.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { code } = body

    if (!code || typeof code !== 'string' || code.length < 6) {
      return NextResponse.json(
        { error: 'Code 2FA invalide.' },
        { status: 400 }
      )
    }

    const result = await enableTwoFactor(session.userId, code)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    await logAudit({
      eventType: 'AUTH_PASSWORD_CHANGE',
      userId: session.userId,
      userRole: session.role,
      description: '2FA enabled successfully',
    }, request)

    return NextResponse.json({
      message: 'Authentification à deux facteurs activée avec succès.',
    })
  } catch (error) {
    console.error('[2FA_VERIFY_ERROR]', error)
    return NextResponse.json(
      { error: 'Erreur lors de la vérification 2FA.' },
      { status: 500 }
    )
  }
}
