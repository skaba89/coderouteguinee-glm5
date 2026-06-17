// ============================================================
// CodeRoute Guinée — Password Reset
// POST /api/auth/reset-password — Request a reset token
// PUT  /api/auth/reset-password — Confirm reset with new password
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hash } from 'bcryptjs'
import { randomBytes } from 'crypto'
import { logAudit } from '@/lib/audit-log'
import { sendNotification } from '@/lib/notifications'

// ─── POST: Request password reset ──────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, telephone } = body

    if (!email && !telephone) {
      return NextResponse.json(
        { error: 'Veuillez fournir votre email ou numéro de téléphone.' },
        { status: 400 }
      )
    }

    // Find user by email or telephone
    const user = await db.user.findFirst({
      where: {
        actif: true,
        ...(email ? { email: email.toLowerCase().trim() } : {}),
        ...(telephone ? { telephone: telephone.trim() } : {}),
      },
    })

    // Always return success to prevent user enumeration
    if (!user) {
      await logAudit({
        eventType: 'AUTH_PASSWORD_RESET_REQUEST',
        severity: 'warning',
        description: `Password reset requested for unknown ${email ? 'email' : 'phone'}: ${email || telephone}`,
      }, request)

      return NextResponse.json({
        message: 'Si votre compte existe, un code de réinitialisation a été envoyé.',
      })
    }

    // Invalidate any existing reset tokens for this user
    await db.passwordResetToken.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    })

    // Generate tokens
    const resetCode = randomBytes(3).toString('hex').toUpperCase() // 6-char code for SMS
    const resetToken = randomBytes(32).toString('hex') // Full token for verification

    // Store the token (expires in 30 minutes)
    await db.passwordResetToken.create({
      data: {
        userId: user.id,
        token: resetToken,
        used: false,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      },
    })

    // In production: send resetCode via SMS (Orange/MTN API) or email
    await logAudit({
      eventType: 'AUTH_PASSWORD_RESET_REQUEST',
      userId: user.id,
      description: `Password reset token generated for ${user.email}`,
      details: { method: email ? 'email' : 'sms' },
    }, request)

    // Send notification with the reset code
    const channel = email ? 'email' : 'sms' as const
    const recipient = email ? user.email : user.telephone
    sendNotification({
      userId: user.id,
      channel,
      template: 'password_reset',
      recipient,
      variables: { code: resetCode, prenom: user.prenom },
    }).catch(err => console.error('[PASSWORD_RESET_NOTIFICATION_ERROR]', err))

    return NextResponse.json({
      message: 'Si votre compte existe, un code de réinitialisation a été envoyé.',
      // Demo only: expose token for testing. REMOVE in production.
      ...(process.env.NODE_ENV !== 'production' ? {
        _demo: {
          resetCode,
          resetToken,
          userId: user.id,
        },
      } : {}),
    })
  } catch (error) {
    console.error('[RESET_PASSWORD_REQUEST_ERROR]', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur.' },
      { status: 500 }
    )
  }
}

// ─── PUT: Confirm password reset ───────────────────────────
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, newPassword } = body

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'Token et nouveau mot de passe requis.' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 8 caractères.' },
        { status: 400 }
      )
    }

    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre.' },
        { status: 400 }
      )
    }

    // Find the reset token
    const resetToken = await db.passwordResetToken.findUnique({
      where: { token },
    })

    if (!resetToken || resetToken.used) {
      return NextResponse.json(
        { error: 'Token invalide ou déjà utilisé.' },
        { status: 400 }
      )
    }

    // Check expiration
    if (new Date() > resetToken.expiresAt) {
      await db.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      })
      return NextResponse.json(
        { error: 'Token expiré. Veuillez demander un nouveau code.' },
        { status: 400 }
      )
    }

    // Hash new password
    const passwordHash = await hash(newPassword, 10)

    // Update user password
    await db.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    })

    // Mark token as used
    await db.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true },
    })

    // Invalidate all other tokens for this user
    await db.passwordResetToken.updateMany({
      where: { userId: resetToken.userId, used: false },
      data: { used: true },
    })

    await logAudit({
      eventType: 'AUTH_PASSWORD_RESET_COMPLETE',
      userId: resetToken.userId,
      severity: 'warning',
      description: 'Password reset completed successfully',
    }, request)

    return NextResponse.json({
      message: 'Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter.',
    })
  } catch (error) {
    console.error('[RESET_PASSWORD_CONFIRM_ERROR]', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur.' },
      { status: 500 }
    )
  }
}
