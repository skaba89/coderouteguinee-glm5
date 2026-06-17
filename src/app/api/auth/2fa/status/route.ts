// ============================================================
// CodeRoute Guinée — 2FA Status Endpoint
// GET /api/auth/2fa/status — Check if 2FA is enabled
// ============================================================

import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { getTwoFactorStatus } from '@/lib/two-factor'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Authentification requise.' },
        { status: 401 }
      )
    }

    const status = await getTwoFactorStatus(session.userId)
    return NextResponse.json(status)
  } catch (error) {
    console.error('[2FA_STATUS_ERROR]', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du statut 2FA.' },
      { status: 500 }
    )
  }
}
