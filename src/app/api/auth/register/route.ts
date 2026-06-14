import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { createSession, setSessionCookie } from '@/lib/session'

function generateCandidateNumber(): string {
  const year = new Date().getFullYear()
  const code = String(Math.floor(Math.random() * 1000000)).padStart(6, '0')
  return `GN-CODE-${year}-${code}`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      email,
      password,
      nom,
      prenom,
      dateNaissance,
      numeroIdentite,
      telephone,
      ville,
      region,
      categoriePermis,
      role,
    } = body

    // Validate required fields
    if (!email || !password || !nom || !prenom || !dateNaissance || !numeroIdentite || !telephone) {
      return NextResponse.json(
        { error: 'Veuillez remplir tous les champs obligatoires' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 6 caractères' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await db.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json(
        { error: 'Un compte avec cet email existe déjà' },
        { status: 409 }
      )
    }

    // Check if numeroIdentite already exists
    const existingIdentite = await db.user.findUnique({ where: { numeroIdentite } })
    if (existingIdentite) {
      return NextResponse.json(
        { error: 'Ce numéro d\'identité est déjà enregistré' },
        { status: 409 }
      )
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(password, salt)

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
        email,
        passwordHash,
        nom,
        prenom,
        dateNaissance,
        numeroIdentite,
        telephone,
        ville: ville || 'Conakry',
        region: region || 'Conakry',
        categoriePermis: categoriePermis || 'B',
        role: role || 'candidat',
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
