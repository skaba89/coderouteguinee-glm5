// ============================================================
// CodeRoute Guinée — Admin Payments API
// GET /api/admin/payments — List bookings with payment info + stats
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'super-admin' && session.role !== 'administration')) {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const statutPaiement = searchParams.get('statutPaiement') || undefined
    const search = searchParams.get('search') || undefined
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (statutPaiement) where.statutPaiement = statutPaiement
    if (search) {
      where.OR = [
        { referencePaiement: { contains: search } },
        { numeroPaiement: { contains: search } },
        { candidat: { nom: { contains: search } } },
        { candidat: { prenom: { contains: search } } },
        { candidat: { email: { contains: search } } },
        { candidat: { numeroUnique: { contains: search } } },
      ]
    }

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

    // Aggregate stats
    const allBookings = await db.booking.findMany({
      select: { statutPaiement: true, montant: true, moyenPaiement: true, createdAt: true },
    })

    const stats = {
      total: allBookings.length,
      confirmed: allBookings.filter(b => b.statutPaiement === 'confirme').length,
      pending: allBookings.filter(b => b.statutPaiement === 'en_attente').length,
      failed: allBookings.filter(b => b.statutPaiement === 'echoue').length,
      refunded: allBookings.filter(b => b.statutPaiement === 'rembourse').length,
      revenue: allBookings
        .filter(b => b.statutPaiement === 'confirme')
        .reduce((sum, b) => sum + b.montant, 0),
      byMethod: {
        mobile_money: allBookings.filter(b => b.moyenPaiement === 'mobile_money').length,
        cash: allBookings.filter(b => b.moyenPaiement === 'cash').length,
        carte: allBookings.filter(b => b.moyenPaiement === 'carte').length,
      },
    }

    return NextResponse.json({
      bookings,
      stats,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('[ADMIN_PAYMENTS_LIST_ERROR]', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
