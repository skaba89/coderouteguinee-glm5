import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { createSession, setSessionCookie } from '@/lib/session'
import { validateInput, registerSchema } from '@/lib/validation'
import { logAudit } from '@/lib/audit-log'

function generateCandidateNumber(): string {
  const year = new Date().getFullYear()
  const code = String(Math.floor(Math.random() * 1000000)).padStart(6, '0')
  return `GN-CODE-${year}-${code}`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input with Zod schema
    const validation = validateInput(registerSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.errors.join(', ') },
        { status: 400 }
      )
    }

    const data = validation.data

    // Check if email already exists
    const existingUser = await db.user.findUnique({ where: { email: data.email.toLowerCase() } })
    if (existingUser) {
      return NextResponse.json(
        { error: 'Un compte avec cet email existe déjà' },
        { status: 409 }
      )
    }

    // Check if numeroIdentite already exists
    const existingIdentite = await db.user.findUnique({ where: { numeroIdentite: data.numeroIdentite } })
    if (existingIdentite) {
      return NextResponse.json(
        { error: 'Ce numéro d\'identité est déjà enregistré' },
        { status: 409 }
      )
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(data.password, salt)

    // Generate unique candidate number
    let numeroUnique = generateCandidateNumber()
    let existingNumero = await db.user.findUnique({ where: { numeroUnique } })
    while (existingNumero) {
      numeroUnique = generateCandidateNumber()
      existingNumero = await db.user.findUnique({ where: { numeroUnique } })
    }

    // Create user
    const user = await db.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash,
        nom: data.nom,
        prenom: data.prenom,
        dateNaissance: data.dateNaissance,
        numeroIdentite: data.numeroIdentite,
        telephone: data.telephone,
        ville: data.ville,
        region: data.region,
        categoriePermis: data.categoriePermis,
        role: 'candidat', // Always candidat on registration
        numeroUnique,
      },
    })

    // Create JWT session
    const token = await createSession({
      userId: user.id,
      email: user.email,
      role: user.role,
      numeroUnique: user.numeroUnique,
      nom: user.nom,
      prenom: user.prenom,
    })

    // Log registration
    await logAudit({
      eventType: 'AUTH_REGISTER',
      userId: user.id,
      description: `New candidate registered: ${user.email}`,
    }, request)

    // Return user without passwordHash
    const { passwordHash: _, ...userWithoutPassword } = user

    const response = NextResponse.json({ user: userWithoutPassword }, { status: 201 })
    setSessionCookie(response, token)

    return response
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
