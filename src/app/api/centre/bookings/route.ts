// ============================================================
// CodeRoute Guinée — Centre agréé endpoints
// GET   /api/centre/bookings       — list bookings for the centre
// PATCH /api/centre/bookings       — confirm/reject a booking
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { logAudit } from '@/lib/audit-log'

export const dynamic = 'force-dynamic'

// ─── GET: list bookings ──────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Authentification requise' }, { status: 401 })
    }
    if (session.role !== 'centre-agree' && session.role !== 'super-admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const statutPaiement = searchParams.get('statutPaiement') || ''
    const date = searchParams.get('date') || ''
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200)
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: Record<string, unknown> = {}
    if (statutPaiement) where.statutPaiement = statutPaiement
    if (date) where.date = date

    const [bookings, total] = await Promise.all([
      db.booking.findMany({
        where,
        include: {
          candidat: {
            select: {
              id: true,
              nom: true,
              prenom: true,
              email: true,
              telephone: true,
              numeroUnique: true,
              categoriePermis: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.booking.count({ where }),
    ])

    return NextResponse.json({ bookings, total, limit, offset })
  } catch (error) {
    console.error('[CENTRE_BOOKINGS_GET_ERROR]', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des réservations.' },
      { status: 500 }
    )
  }
}

// ─── PATCH: confirm or reject a booking ──────────────────
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Authentification requise' }, { status: 401 })
    }
    if (session.role !== 'centre-agree' && session.role !== 'super-admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
    const { bookingId, action, notes } = body as {
      bookingId: string
      action: 'confirm' | 'reject'
      notes?: string
    }

    if (!bookingId || !action || !['confirm', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'bookingId et action (confirm|reject) requis' },
        { status: 400 }
      )
    }

    const booking = await db.booking.findUnique({ where: { id: bookingId } })
    if (!booking) {
      return NextResponse.json({ error: 'Réservation introuvable' }, { status: 404 })
    }

    if (action === 'confirm') {
      const updated = await db.booking.update({
        where: { id: bookingId },
        data: {
          confirmee: true,
          statutPaiement: 'confirme',
          numeroConvocation: `CONV-${Date.now().toString(36).toUpperCase()}`,
        },
      })
      await logAudit({
        eventType: 'BOOKING_CONFIRM',
        description: `Réservation ${bookingId} confirmée par le centre`,
        userId: session.userId,
        userRole: session.role,
        targetId: bookingId,
        targetType: 'Booking',
        details: { notes },
      }, request)
      return NextResponse.json({ booking: updated })
    } else {
      const updated = await db.booking.update({
        where: { id: bookingId },
        data: {
          confirmee: false,
          statutPaiement: 'echoue',
        },
      })
      await logAudit({
        eventType: 'BOOKING_REJECT',
        description: `Réservation ${bookingId} rejetée par le centre`,
        userId: session.userId,
        userRole: session.role,
        targetId: bookingId,
        targetType: 'Booking',
        details: { notes },
      }, request)
      return NextResponse.json({ booking: updated })
    }
  } catch (error) {
    console.error('[CENTRE_BOOKINGS_PATCH_ERROR]', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la réservation.' },
      { status: 500 }
    )
  }
}
