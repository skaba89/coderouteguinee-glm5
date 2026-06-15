import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

// ─── PATCH: Update a booking (admin only) ─────────────────
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'administration' && session.role !== 'super-admin')) {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { statutPaiement, confirmee, notes } = body

    const existing = await db.booking.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Réservation non trouvée' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (statutPaiement && ['en_attente', 'confirme', 'echoue', 'rembourse'].includes(statutPaiement)) {
      updateData.statutPaiement = statutPaiement
    }
    if (confirmee !== undefined) {
      updateData.confirmee = confirmee
    }

    const updated = await db.booking.update({
      where: { id },
      data: updateData,
      include: {
        candidat: {
          select: { id: true, nom: true, prenom: true, numeroUnique: true },
        },
        centre: {
          select: { id: true, nom: true, ville: true },
        },
      },
    })

    return NextResponse.json({ booking: updated })
  } catch (error) {
    console.error('Admin booking update error:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
