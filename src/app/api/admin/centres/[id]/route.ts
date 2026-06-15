import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

// ─── PATCH: Update a centre (admin only) ──────────────────
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'administration' && session.role !== 'super-admin' && session.role !== 'centre-agree')) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()

    const existing = await db.centre.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Centre non trouvé' }, { status: 404 })
    }

    // centre-agree can only edit their own centre
    if (session.role === 'centre-agree') {
      // For now, centre-agree users cannot access this — they would need a centreId link
      return NextResponse.json({ error: 'Accès limité aux administrateurs' }, { status: 403 })
    }

    const allowedFields = ['nom', 'ville', 'region', 'adresse', 'capacite', 'telephone', 'email', 'actif', 'accredDateDebut', 'accredDateFin', 'accredStatut', 'accredScore', 'equipements', 'languesDisponibles']
    const updateData: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === 'equipements' && Array.isArray(body[field])) {
          updateData[field] = JSON.stringify(body[field])
        } else if (field === 'languesDisponibles' && Array.isArray(body[field])) {
          updateData[field] = JSON.stringify(body[field])
        } else {
          updateData[field] = body[field]
        }
      }
    }

    // Validate accreditation status
    if (updateData.accredStatut && !['actif', 'en_renouvellement', 'expire', 'suspendu'].includes(updateData.accredStatut as string)) {
      return NextResponse.json({ error: 'Statut d\'accréditation invalide' }, { status: 400 })
    }

    const updated = await db.centre.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      centre: {
        ...updated,
        equipements: updated.equipements ? JSON.parse(updated.equipements) : [],
        languesDisponibles: JSON.parse(updated.languesDisponibles),
      },
    })
  } catch (error) {
    console.error('Admin centre update error:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
