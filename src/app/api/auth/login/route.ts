import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { createSession, setSessionCookie } from '@/lib/session'
import { validateInput, loginSchema } from '@/lib/validation'
import { logAudit } from '@/lib/audit-log'

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
      description: `User ${user.email} logged in successfully`,
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
