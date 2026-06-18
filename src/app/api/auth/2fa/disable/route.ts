// ============================================================
// CodeRoute Guinée — 2FA Disable Endpoint
// POST /api/auth/2fa/disable — Disable 2FA (requires password)
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { disableTwoFactor } from '@/lib/two-factor'
import { logAudit } from '@/lib/audit-log'
import bcrypt from 'bcryptjs'

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
    const { password } = body

    if (!password) {
      return NextResponse.json(
        { error: 'Mot de passe requis pour désactiver 2FA.' },
        { status: 400 }
      )
    }

    // Verify password
    const user = await db.user.findUnique({ where: { id: session.userId } })
    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé.' },
        { status: 404 }
      )
    }

    const isValid = await bcrypt.compare(password, user.passwordHash)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Mot de passe incorrect.' },
        { status: 400 }
      )
    }

    await disableTwoFactor(session.userId)

    await logAudit({
      eventType: 'AUTH_PASSWORD_CHANGE',
      userId: session.userId,
      userRole: session.role,
      severity: 'warning',
      description: '2FA disabled by user',
    }, request)

    return NextResponse.json({
      message: 'Authentification à deux facteurs désactivée.',
    })
  } catch (error) {
    console.error('[2FA_DISABLE_ERROR]', error)
    return NextResponse.json(
      { error: 'Erreur lors de la désactivation 2FA.' },
      { status: 500 }
    )
  }
}
