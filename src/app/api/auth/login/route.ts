import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { createSession, setSessionCookie } from '@/lib/session'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({ where: { email } })

    if (!user) {
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      )
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)

    if (!isPasswordValid) {
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
