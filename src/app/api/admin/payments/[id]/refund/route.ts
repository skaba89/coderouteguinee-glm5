// ============================================================
// CodeRoute Guinée — Admin Payment Refund API
// POST /api/admin/payments/{id}/refund — Mark a payment as refunded
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { logAudit } from '@/lib/audit-log'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'super-admin') {
      return NextResponse.json(
        { error: 'Seul un super-admin peut rembourser un paiement.' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const reason = body.reason || 'Non spécifié'

    const booking = await db.booking.findUnique({ where: { id } })
    if (!booking) {
      return NextResponse.json({ error: 'Réservation non trouvée' }, { status: 404 })
    }

    if (booking.statutPaiement !== 'confirme') {
      return NextResponse.json({
        error: `Remboursement impossible: le paiement est "${booking.statutPaiement}" (doit être "confirme")`,
      }, { status: 400 })
    }

    const updated = await db.booking.update({
      where: { id },
      data: { statutPaiement: 'rembourse' },
    })

    await logAudit({
      eventType: 'PAYMENT_FAIL',
      userId: session.userId,
      userRole: session.role,
      description: `Payment refunded for booking ${id} (${booking.montant} GNF). Reason: ${reason}`,
      targetType: 'booking',
      targetId: id,
    }, request)

    return NextResponse.json({
      success: true,
      booking: updated,
      message: `Paiement de ${booking.montant} GNF marqué comme remboursé`,
    })
  } catch (error) {
    console.error('[ADMIN_PAYMENT_REFUND_ERROR]', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
