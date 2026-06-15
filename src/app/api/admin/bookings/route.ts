import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

// ─── GET: List all bookings (admin only) ──────────────────
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'administration' && session.role !== 'super-admin')) {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const statutPaiement = searchParams.get('statutPaiement')
    const confirmee = searchParams.get('confirmee')
    const centreId = searchParams.get('centreId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (statutPaiement) where.statutPaiement = statutPaiement
    if (confirmee !== null) where.confirmee = confirmee === 'true'
    if (centreId) where.centreId = centreId

    const [bookings, total] = await Promise.all([
      db.booking.findMany({
        where,
        include: {
          candidat: {
            select: { id: true, nom: true, prenom: true, numeroUnique: true, telephone: true, email: true },
          },
          centre: {
            select: { id: true, nom: true, ville: true, region: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.booking.count({ where }),
    ])

    return NextResponse.json({
      bookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Admin bookings list error:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
