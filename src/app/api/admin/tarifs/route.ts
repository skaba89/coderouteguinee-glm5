import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { logAudit } from '@/lib/audit-log'
import { invalidateTarifCache, getAllTarifs } from '@/lib/tarif'

// ─── GET /api/admin/tarifs — Liste tous les tarifs ────────────────────
export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'super-admin') {
    return NextResponse.json({ error: 'Accès réservé au super-administrateur' }, { status: 403 })
  }
  const tarifs = await getAllTarifs()
  return NextResponse.json({ tarifs })
}

// ─── POST /api/admin/tarifs — Crée un nouveau tarif ───────────────────
export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'super-admin') {
    return NextResponse.json({ error: 'Accès réservé au super-administrateur' }, { status: 403 })
  }

  const body = await request.json()
  const { cle, libelle, montant, categoriePermis, note } = body

  // Validation
  if (!cle || typeof cle !== 'string' || cle.length < 3) {
    return NextResponse.json({ error: 'Clé invalide (min 3 caractères)' }, { status: 400 })
  }
  if (!libelle || typeof libelle !== 'string' || libelle.length < 5) {
    return NextResponse.json({ error: 'Libellé invalide (min 5 caractères)' }, { status: 400 })
  }
  if (!Number.isInteger(montant) || montant < 1000 || montant > 10_000_000) {
    return NextResponse.json({ error: 'Montant invalide (1 000 ≤ montant ≤ 10 000 000 GNF)' }, { status: 400 })
  }
  const cat = String(categoriePermis || 'B').toUpperCase()
  if (!['A', 'A1', 'B', 'C', 'D', 'E'].includes(cat)) {
    return NextResponse.json({ error: 'Catégorie de permis invalide' }, { status: 400 })
  }

  // Vérifie l'unicité de la clé
  const existing = await db.tarifConfig.findUnique({ where: { cle } })
  if (existing) {
    return NextResponse.json({ error: `Un tarif avec la clé "${cle}" existe déjà` }, { status: 409 })
  }

  const tarif = await db.tarifConfig.create({
    data: {
      cle,
      libelle,
      montant,
      categoriePermis: cat,
      note: note || null,
      modifiePar: session.userId,
      actif: true,
    },
  })

  invalidateTarifCache()

  await logAudit({
    eventType: 'TARIF_CREATE',
    severity: 'info',
    userId: session.userId,
    userRole: session.role,
    targetType: 'TarifConfig',
    targetId: tarif.id,
    description: `Création tarif ${cle} (${montant} GNF)`,
    details: { cle, montant, categoriePermis: cat },
  })

  return NextResponse.json({ tarif }, { status: 201 })
}
