// ============================================================
// CodeRoute Guinée — Auto-école endpoints
// GET  /api/auto-ecole/students  — list students of the auto-ecole
// POST /api/auto-ecole/students  — register a new student
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { logAudit } from '@/lib/audit-log'
import { sendNotification } from '@/lib/notifications'
import { validateInput, registerSchema } from '@/lib/validation'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'

// ─── Generate a unique candidate number (GN-CODE-YYYY-XXXXXX) ──
function generateNumeroUnique(): string {
  const year = new Date().getFullYear()
  const random = randomBytes(3).toString('hex').toUpperCase().padStart(6, '0').slice(0, 6)
  return `GN-CODE-${year}-${random}`
}

// ─── Generate a strong temporary password ─────────────────
function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let pwd = ''
  const bytes = randomBytes(12)
  for (let i = 0; i < 12; i++) {
    pwd += chars[bytes[i] % chars.length]
  }
  // Ensure complexity
  return `Aa1!${pwd}`
}

// ─── GET: list students ───────────────────────────────────
export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Authentification requise' }, { status: 401 })
  }
  if (session.role !== 'auto-ecole' && session.role !== 'super-admin') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || ''
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200)
  const offset = parseInt(searchParams.get('offset') || '0')

  const where: Record<string, unknown> = {
    role: 'candidat',
    // Filter students by auto-ecole (using telephone prefix or matching region for MVP)
    // In a full system, we'd have a foreign key autoEcoleId on User
  }
  if (search) {
    where.OR = [
      { nom: { contains: search } },
      { prenom: { contains: search } },
      { email: { contains: search } },
      { numeroUnique: { contains: search } },
    ]
  }

  const [students, total] = await Promise.all([
    db.user.findMany({
      where,
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        telephone: true,
        numeroUnique: true,
        ville: true,
        categoriePermis: true,
        actif: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    db.user.count({ where }),
  ])

  return NextResponse.json({ students, total, limit, offset })
}

// ─── POST: create a new student ───────────────────────────
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Authentification requise' }, { status: 401 })
    }
    if (session.role !== 'auto-ecole' && session.role !== 'super-admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()

    // Generate a temp password if not provided
    const tempPassword = body.password || generateTempPassword()
    const payload = { ...body, password: tempPassword }

    const validation = validateInput(registerSchema, payload)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validation.errors },
        { status: 400 }
      )
    }

    const data = validation.data as {
      email: string
      password: string
      nom: string
      prenom: string
      dateNaissance: string
      numeroIdentite: string
      telephone: string
      ville: string
      region: string
      categoriePermis?: string
    }

    // Check for existing email/numeroIdentite
    const existing = await db.user.findFirst({
      where: {
        OR: [{ email: data.email }, { numeroIdentite: data.numeroIdentite }],
      },
    })
    if (existing) {
      return NextResponse.json(
        { error: 'Email ou numéro d\'identité déjà utilisé' },
        { status: 409 }
      )
    }

    // Generate unique candidate number
    let numeroUnique = generateNumeroUnique()
    let exists = await db.user.findUnique({ where: { numeroUnique } })
    while (exists) {
      numeroUnique = generateNumeroUnique()
      exists = await db.user.findUnique({ where: { numeroUnique } })
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10)

    // Create user
    const user = await db.user.create({
      data: {
        email: data.email,
        passwordHash,
        nom: data.nom,
        prenom: data.prenom,
        dateNaissance: data.dateNaissance,
        numeroIdentite: data.numeroIdentite,
        telephone: data.telephone,
        ville: data.ville,
        region: data.region,
        categoriePermis: data.categoriePermis || 'B',
        role: 'candidat',
        numeroUnique,
        actif: true,
      },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        telephone: true,
        numeroUnique: true,
        ville: true,
        categoriePermis: true,
        createdAt: true,
      },
    })

    // Audit log
    await logAudit({
      eventType: 'AUTO_ECOLE_STUDENT_REGISTERED',
      description: `Auto-école ${session.email} a inscrit l'étudiant ${user.email}`,
      userId: session.userId,
      userRole: session.role,
      targetId: user.id,
      targetType: 'User',
      details: { numeroUnique: user.numeroUnique, tempPasswordProvided: !body.password },
    }, request)

    // Send welcome notification (console in dev)
    await sendNotification({
      userId: user.id,
      channel: 'email',
      template: 'welcome',
      recipient: user.email,
      variables: {
        prenom: user.prenom,
        nom: user.nom,
        email: user.email,
        numeroUnique: user.numeroUnique,
      },
    }).catch(() => {
      // Non-blocking: notification failure should not fail registration
    })

    return NextResponse.json({
      user,
      tempPassword: body.password ? undefined : tempPassword,
      message: 'Étudiant inscrit avec succès',
    }, { status: 201 })
  } catch (error) {
    console.error('[AUTO_ECOLE_STUDENT_CREATE_ERROR]', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'inscription de l\'étudiant.' },
      { status: 500 }
    )
  }
}
