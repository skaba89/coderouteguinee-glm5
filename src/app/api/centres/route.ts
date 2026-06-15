import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const centres = await db.centre.findMany({
      where: { actif: true },
      orderBy: { nom: 'asc' },
    })

    // Parse JSON string fields back to arrays
    const parsedCentres = centres.map((c) => ({
      ...c,
      equipements: c.equipements ? JSON.parse(c.equipements) : [],
      languesDisponibles: JSON.parse(c.languesDisponibles),
    }))

    return NextResponse.json(parsedCentres)
  } catch (error) {
    console.error('Centres fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
