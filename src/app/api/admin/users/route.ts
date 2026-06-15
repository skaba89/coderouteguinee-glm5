import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

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
