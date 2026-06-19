import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import bcrypt from 'bcryptjs'
import { logAudit } from '@/lib/audit-log'

// ─── Role-specific numeroUnique prefix ────────────────────
function getRolePrefix(role: string): string {
  switch (role) {
    case 'auto-ecole': return 'GN-AE'
    case 'centre-agree': return 'GN-CA'
    case 'administration': return 'GN-AD'
    case 'super-admin': return 'GN-SA'
    default: return 'GN-CODE'
  }
}

async function generateUniqueNumero(role: string): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = getRolePrefix(role)
  let code = String(Math.floor(Math.random() * 1000000)).padStart(6, '0')
  let numero = `${prefix}-${year}-${code}`
  let exists = await db.user.findUnique({ where: { numeroUnique: numero } })
  while (exists) {
    code = String(Math.floor(Math.random() * 1000000)).padStart(6, '0')
    numero = `${prefix}-${year}-${code}`
    exists = await db.user.findUnique({ where: { numeroUnique: numero } })
  }
  return numero
}

// ─── POST: Create a new user with specific role (admin only) ─
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'administration' && session.role !== 'super-admin')) {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 })
    }

    const body = await request.json()
    const {
      email, password, nom, prenom, dateNaissance, numeroIdentite,
      telephone, ville, region, categoriePermis, role,
    } = body

    // Validate required fields
    if (!email || !password || !nom || !prenom || !telephone) {
      return NextResponse.json({
        error: 'Champs requis manquants: email, password, nom, prenom, telephone',
      }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Le mot de passe doit contenir au moins 8 caractères' }, { status: 400 })
    }

    // Validate role
    const allowedRoles = ['candidat', 'auto-ecole', 'centre-agree', 'administration']
    if (!allowedRoles.includes(role)) {
      return NextResponse.json({
        error: `Rôle invalide. Valeurs acceptées: ${allowedRoles.join(', ')}. super-admin réservé au seed.`,
      }, { status: 400 })
    }

    // Only super-admin can create administration accounts
    if (role === 'administration' && session.role !== 'super-admin') {
      return NextResponse.json({
        error: 'Seul un super-admin peut créer un compte administration',
      }, { status: 403 })
    }

    // Check email uniqueness
    const existingEmail = await db.user.findUnique({ where: { email: email.toLowerCase() } })
    if (existingEmail) {
      return NextResponse.json({ error: 'Un compte avec cet email existe déjà' }, { status: 409 })
    }

    // Check numeroIdentite uniqueness (if provided)
    if (numeroIdentite) {
      const existingIdentite = await db.user.findUnique({ where: { numeroIdentite } })
      if (existingIdentite) {
        return NextResponse.json({ error: 'Ce numéro d\'identité est déjà enregistré' }, { status: 409 })
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(password, salt)

    // Generate unique numero
    const numeroUnique = await generateUniqueNumero(role)

    // Default values for non-candidat roles
    const finalDateNaissance = dateNaissance || '1990-01-01'
    const finalNumeroIdentite = numeroIdentite || `ADMIN-${Date.now()}`
    const finalVille = ville || (role === 'auto-ecole' ? 'Conakry' : 'Conakry')
    const finalRegion = region || 'Conakry'
    const finalCategoriePermis = role === 'candidat' ? (categoriePermis || 'B') : 'N/A'

    const user = await db.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        nom,
        prenom,
        dateNaissance: finalDateNaissance,
        numeroIdentite: finalNumeroIdentite,
        telephone,
        ville: finalVille,
        region: finalRegion,
        categoriePermis: finalCategoriePermis,
        role,
        numeroUnique,
      },
      select: {
        id: true, email: true, nom: true, prenom: true, role: true,
        actif: true, numeroUnique: true, telephone: true, ville: true,
        region: true, categoriePermis: true, createdAt: true,
      },
    })

    await logAudit({
      eventType: 'USER_CREATE',
      userId: session.userId,
      userRole: session.role,
      description: `Admin ${session.email} created ${role} account: ${user.email} (${user.numeroUnique})`,
      targetType: 'user',
      targetId: user.id,
    }, request)

    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    console.error('Admin user create error:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}

// ─── GET: List all users (admin only) ─────────────────────
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'administration' && session.role !== 'super-admin')) {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    const actif = searchParams.get('actif')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (role) where.role = role
    if (actif !== null) where.actif = actif === 'true'
    if (search) {
      where.OR = [
        { nom: { contains: search } },
        { prenom: { contains: search } },
        { email: { contains: search } },
        { numeroUnique: { contains: search } },
        { telephone: { contains: search } },
      ]
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          nom: true,
          prenom: true,
          dateNaissance: true,
          numeroIdentite: true,
          telephone: true,
          ville: true,
          region: true,
          categoriePermis: true,
          role: true,
          numeroUnique: true,
          langueMaternelle: true,
          actif: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { examSessions: true, bookings: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.user.count({ where }),
    ])

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Admin users list error:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
