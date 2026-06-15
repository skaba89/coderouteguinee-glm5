import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

// ─── PATCH: Update fraud alert status (admin only) ────────
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
    const { status, notes } = body

    if (!status || !['investigating', 'resolved', 'dismissed'].includes(status)) {
      return NextResponse.json({ error: 'Statut invalide. Utilisez: investigating, resolved, ou dismissed' }, { status: 400 })
    }

    const existing = await db.fraudAlert.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Alerte non trouvée' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {
      status,
      resolvedBy: session.userId,
    }

    if (status === 'resolved' || status === 'dismissed') {
      updateData.resolvedAt = new Date()
    }

    // If notes provided, append to details
    if (notes) {
      const existingDetails = existing.details ? JSON.parse(existing.details) : {}
      updateData.details = JSON.stringify({
        ...existingDetails,
        resolutionNotes: notes,
        resolvedByName: `${session.prenom} ${session.nom}`,
      })
    }

    const updated = await db.fraudAlert.update({
      where: { id },
      data: updateData,
      include: {
        candidat: { select: { id: true, nom: true, prenom: true, numeroUnique: true } },
        centre: { select: { id: true, nom: true, ville: true } },
      },
    })

    // If fraud is resolved with "resolved" status, check if candidate should be blacklisted
    if (status === 'resolved' && existing.candidatId && existing.severity === 'critical') {
      await db.user.update({
        where: { id: existing.candidatId },
        data: { actif: false },
      })
    }

    return NextResponse.json({ alert: updated })
  } catch (error) {
    console.error('Admin fraud update error:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
