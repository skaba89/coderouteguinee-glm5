// ============================================================
// CodeRoute Guinée — 2FA Setup Endpoint
// POST /api/auth/2fa/setup — Generate TOTP secret and backup codes
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { setupTwoFactor } from '@/lib/two-factor'
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

    const result = await setupTwoFactor(session.userId)

    await logAudit({
      eventType: 'ADMIN_ACTION',
      userId: session.userId,
      userRole: session.role,
      description: '2FA setup initiated',
    }, request)

    return NextResponse.json({
      message: 'Configuration 2FA initiée. Scannez le QR code avec votre application d\'authentification puis vérifiez avec un code.',
      secret: result.secret,
      qrUri: result.qrUri,
      backupCodes: result.backupCodes,
      // Note: backup codes are only shown once — user must save them
      warning: 'Conservez vos codes de secours en lieu sûr. Ils ne seront plus jamais affichés.',
    })
  } catch (error) {
    console.error('[2FA_SETUP_ERROR]', error)
    return NextResponse.json(
      { error: 'Erreur lors de la configuration 2FA.' },
      { status: 500 }
    )
  }
}
