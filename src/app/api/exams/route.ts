import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      candidatId,
      centreId,
      date,
      heure,
      langue,
      totalQuestions,
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

    const session = await db.examSession.create({
      data: {
        candidatId,
        centreId,
        centreNom: centre.nom,
        date,
        heure,
        langue: langue || 'fr',
        totalQuestions: totalQuestions || 40,
        statut: 'programme',
      },
    })

    return NextResponse.json(session, { status: 201 })
  } catch (error) {
    console.error('Exam creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
