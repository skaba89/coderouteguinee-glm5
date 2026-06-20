import { NextRequest, NextResponse } from 'next/server'
import { getCurrentTarif } from '@/lib/tarif'

// ─── GET /api/tarifs/current?categorie=B — Tarif public courant ───────
// Pas d'auth requise : le tarif est public (affiché sur la home et le flow réservation)
export async function GET(request: NextRequest) {
  const categorie = (request.nextUrl.searchParams.get('categorie') || 'B').toUpperCase()
  const cle = `examen_reservation_${categorie}`
  const tarif = await getCurrentTarif(cle)
  return NextResponse.json({
    cle: tarif.cle,
    categorie,
    montant: tarif.montant,
    libelle: tarif.libelle,
    source: tarif.source,
    formatted: `${tarif.montant.toLocaleString('fr-FR')} GNF`,
  })
}
