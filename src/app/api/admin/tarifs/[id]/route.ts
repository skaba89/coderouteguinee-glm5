import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { logAudit } from '@/lib/audit-log'
import { invalidateTarifCache } from '@/lib/tarif'

// ─── GET /api/admin/tarifs/[id] — Détail d'un tarif ───────────────────
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || session.role !== 'super-admin') {
    return NextResponse.json({ error: 'Accès réservé au super-administrateur' }, { status: 403 })
  }
  const { id } = await params
  const tarif = await db.tarifConfig.findUnique({ where: { id } })
  if (!tarif) {
    return NextResponse.json({ error: 'Tarif introuvable' }, { status: 404 })
  }
  return NextResponse.json({ tarif })
}

// ─── PATCH /api/admin/tarifs/[id] — Met à jour un tarif ───────────────
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || session.role !== 'super-admin') {
    return NextResponse.json({ error: 'Accès réservé au super-administrateur' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()
  const { libelle, montant, categoriePermis, note, actif } = body

  const existing = await db.tarifConfig.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: 'Tarif introuvable' }, { status: 404 })
  }

  const updateData: Record<string, unknown> = { modifiePar: session.userId }

  if (libelle !== undefined) {
    if (typeof libelle !== 'string' || libelle.length < 5) {
      return NextResponse.json({ error: 'Libellé invalide (min 5 caractères)' }, { status: 400 })
    }
    updateData.libelle = libelle
  }

  if (montant !== undefined) {
    if (!Number.isInteger(montant) || montant < 1000 || montant > 10_000_000) {
      return NextResponse.json({ error: 'Montant invalide (1 000 ≤ montant ≤ 10 000 000 GNF)' }, { status: 400 })
    }
    updateData.montant = montant
  }

  if (categoriePermis !== undefined) {
    const cat = String(categoriePermis).toUpperCase()
    if (!['A', 'A1', 'B', 'C', 'D', 'E'].includes(cat)) {
      return NextResponse.json({ error: 'Catégorie de permis invalide' }, { status: 400 })
    }
    updateData.categoriePermis = cat
  }

  if (note !== undefined) {
    updateData.note = note || null
  }

  if (actif !== undefined) {
    updateData.actif = Boolean(actif)
  }

  const updated = await db.tarifConfig.update({
    where: { id },
    data: updateData,
  })

  invalidateTarifCache()

  await logAudit({
    eventType: 'TARIF_UPDATE',
    severity: 'info',
    userId: session.userId,
    userRole: session.role,
    targetType: 'TarifConfig',
    targetId: id,
    description: `Modification tarif ${existing.cle} — montant ${existing.montant} → ${updated.montant} GNF`,
    details: {
      avant: { montant: existing.montant, libelle: existing.libelle, actif: existing.actif },
      apres: { montant: updated.montant, libelle: updated.libelle, actif: updated.actif },
    },
  })

  return NextResponse.json({ tarif: updated })
}

// ─── DELETE /api/admin/tarifs/[id] — Désactive (soft delete) ──────────
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || session.role !== 'super-admin') {
    return NextResponse.json({ error: 'Accès réservé au super-administrateur' }, { status: 403 })
  }

  const { id } = await params
  const existing = await db.tarifConfig.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: 'Tarif introuvable' }, { status: 404 })
  }

  // Soft delete — on garde l'historique, on désactive juste
  const updated = await db.tarifConfig.update({
    where: { id },
    data: { actif: false, modifiePar: session.userId },
  })

  invalidateTarifCache()

  await logAudit({
    eventType: 'TARIF_DESACTIVATE',
    severity: 'warning',
    userId: session.userId,
    userRole: session.role,
    targetType: 'TarifConfig',
    targetId: id,
    description: `Désactivation tarif ${existing.cle}`,
  })

  return NextResponse.json({ tarif: updated, message: 'Tarif désactivé' })
}
