// ============================================================
// CodeRoute Guinée — Change Password (authenticated users)
// POST /api/auth/change-password
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hash, compare } from 'bcryptjs'
import { getSession } from '@/lib/session'
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
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Mot de passe actuel et nouveau mot de passe requis.' },
        { status: 400 }
      )
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Le nouveau mot de passe doit contenir au moins 8 caractères.' },
        { status: 400 }
      )
    }

    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre.' },
        { status: 400 }
      )
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: 'Le nouveau mot de passe doit être différent de l\'ancien.' },
        { status: 400 }
      )
    }

    // Get current user
    const user = await db.user.findUnique({
      where: { id: session.userId },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé.' },
        { status: 404 }
      )
    }

    // Verify current password
    const isValid = await compare(currentPassword, user.passwordHash)
    if (!isValid) {
      await logAudit({
        eventType: 'AUTH_PASSWORD_CHANGE',
        severity: 'warning',
        userId: session.userId,
        description: 'Failed password change attempt — incorrect current password',
      }, request)

      return NextResponse.json(
        { error: 'Mot de passe actuel incorrect.' },
        { status: 400 }
      )
    }

    // Hash and update
    const passwordHash = await hash(newPassword, 10)
    await db.user.update({
      where: { id: session.userId },
      data: { passwordHash },
    })

    await logAudit({
      eventType: 'AUTH_PASSWORD_CHANGE',
      userId: session.userId,
      description: 'Password changed successfully',
    }, request)

    return NextResponse.json({
      message: 'Mot de passe modifié avec succès.',
    })
  } catch (error) {
    console.error('[CHANGE_PASSWORD_ERROR]', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur.' },
      { status: 500 }
    )
  }
}
