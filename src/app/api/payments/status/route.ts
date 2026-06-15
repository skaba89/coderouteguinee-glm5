import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionFromRequest } from '@/lib/session'

// ─── GET: Get payment status for a booking ─────────────────
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const bookingId = searchParams.get('bookingId')

    if (!bookingId) {
      return NextResponse.json(
        { error: 'bookingId requis' },
        { status: 400 }
      )
    }

    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        statutPaiement: true,
        confirmee: true,
        referencePaiement: true,
        numeroPaiement: true,
        moyenPaiement: true,
        montant: true,
        numeroConvocation: true,
      },
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Réservation introuvable' },
        { status: 404 }
      )
    }

    return NextResponse.json(booking)
  } catch (error) {
    console.error('Payment status error:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
