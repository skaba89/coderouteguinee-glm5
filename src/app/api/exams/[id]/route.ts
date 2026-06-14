import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { score, statut, dureeEffective, reponses } = body

    // Check if exam session exists
    const existingSession = await db.examSession.findUnique({ where: { id } })
    if (!existingSession) {
      return NextResponse.json(
        { error: 'Exam session not found' },
        { status: 404 }
      )
    }

    // Update exam session
    const updateData: Record<string, unknown> = {}
    if (score !== undefined) updateData.score = score
    if (statut !== undefined) updateData.statut = statut
    if (dureeEffective !== undefined) updateData.dureeEffective = dureeEffective

    const updatedSession = await db.examSession.update({
      where: { id },
      data: updateData,
    })

    // Create individual Reponse records if provided
    if (reponses && Array.isArray(reponses)) {
      await db.reponse.createMany({
        data: reponses.map(
          (r: { questionId: number; reponseDonnee: number; correcte: boolean; tempsReponse?: number }) => ({
            sessionId: id,
            questionId: r.questionId,
            reponseDonnee: r.reponseDonnee,
            correcte: r.correcte,
            tempsReponse: r.tempsReponse || null,
          })
        ),
        skipDuplicates: true,
      })
    }

    return NextResponse.json(updatedSession)
  } catch (error) {
    console.error('Exam update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
