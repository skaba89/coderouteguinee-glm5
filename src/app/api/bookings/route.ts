import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function generateConvocationReference(): string {
  const code = String(Math.floor(Math.random() * 1000000)).padStart(6, '0')
  return `CONV-${code}`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      candidatId,
      centreId,
      region,
      ville,
      date,
      heure,
      langue,
      categoriePermis,
      montant,
      numeroPaiement,
    } = body

    if (!candidatId || !centreId || !date || !heure) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get centre name
    const centre = await db.centre.findUnique({ where: { id: centreId } })
    if (!centre) {
      return NextResponse.json(
        { error: 'Centre not found' },
        { status: 404 }
      )
    }

    // Verify candidate exists
    const candidat = await db.user.findUnique({ where: { id: candidatId } })
    if (!candidat) {
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      )
    }

    // Generate unique convocation reference
    let numeroConvocation = generateConvocationReference()
    let existingRef = await db.booking.findFirst({
      where: { numeroConvocation },
    })
    while (existingRef) {
      numeroConvocation = generateConvocationReference()
      existingRef = await db.booking.findFirst({
        where: { numeroConvocation },
      })
    }

    const booking = await db.booking.create({
      data: {
        candidatId,
        centreId,
        centreNom: centre.nom,
        region: region || centre.region,
        ville: ville || centre.ville,
        date,
        heure,
        langue: langue || 'fr',
        categoriePermis: categoriePermis || 'B',
        montant: montant || 350000, // 350 000 GNF — tarif réservation examen
        numeroPaiement: numeroPaiement || null,
        numeroConvocation,
        statutPaiement: 'en_attente',
        confirmee: false,
      },
    })

    return NextResponse.json(booking, { status: 201 })
  } catch (error) {
    console.error('Booking creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
