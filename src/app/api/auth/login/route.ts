import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { createSession, setSessionCookie } from '@/lib/session'
import { validateInput, loginSchema } from '@/lib/validation'
import { logAudit } from '@/lib/audit-log'
import { isTwoFactorEnabled, verifyTwoFactorLogin } from '@/lib/two-factor'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validation = validateInput(loginSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.errors.join(', ') },
        { status: 400 }
      )
    }

    const { email, password } = validation.data
    const twoFactorCode = body.twoFactorCode // Optional — only required if 2FA is enabled

    const user = await db.user.findUnique({ where: { email: email.toLowerCase() } })

    if (!user) {
      // Log failed login attempt (without revealing user existence)
      await logAudit({
        eventType: 'AUTH_LOGIN_FAILED',
        severity: 'critical',
        description: `Failed login attempt for email: ${email.substring(0, 3)}***`,
      }, request)

      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      )
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)

    if (!isPasswordValid) {
      await logAudit({
        eventType: 'AUTH_LOGIN_FAILED',
        severity: 'critical',
        userId: user.id,
        description: `Failed login attempt for user ${user.email}`,
      }, request)

      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      )
    }

    if (!user.actif) {
      return NextResponse.json(
        { error: 'Votre compte est désactivé. Contactez l\'administration.' },
        { status: 403 }
      )
    }

    // ─── 2FA verification ──────────────────────────────────
    const twoFactorEnabled = await isTwoFactorEnabled(user.id)
    if (twoFactorEnabled) {
      if (!twoFactorCode) {
        // Inform client that 2FA is required
        return NextResponse.json(
          {
            error: 'Authentification à deux facteurs requise.',
            twoFactorRequired: true,
            userId: user.id,
          },
          { status: 200 }
        )
      }

      const twoFactorResult = await verifyTwoFactorLogin(user.id, twoFactorCode)
      if (!twoFactorResult.success) {
        await logAudit({
          eventType: 'AUTH_LOGIN_FAILED',
          severity: 'critical',
          userId: user.id,
          description: `2FA verification failed for ${user.email}`,
        }, request)

        return NextResponse.json(
          { error: twoFactorResult.error || 'Code 2FA invalide.' },
          { status: 401 }
        )
      }
    }

    // Create JWT session
    const token = await createSession({
      userId: user.id,
      email: user.email,
      role: user.role,
      numeroUnique: user.numeroUnique,
      nom: user.nom,
      prenom: user.prenom,
    })

    // Log successful login
    await logAudit({
      eventType: 'AUTH_LOGIN',
      userId: user.id,
      userRole: user.role,
      description: `User ${user.email} logged in successfully${twoFactorEnabled ? ' (with 2FA)' : ''}`,
    }, request)

    // Return user without passwordHash
    const { passwordHash: _, ...userWithoutPassword } = user

    const response = NextResponse.json({ user: userWithoutPassword })
    setSessionCookie(response, token)

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
