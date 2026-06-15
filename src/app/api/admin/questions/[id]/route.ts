import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

// ─── PATCH: Update a question (admin only) ────────────────
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

    const questionId = parseInt(id)
    if (isNaN(questionId)) {
      return NextResponse.json({ error: 'ID de question invalide' }, { status: 400 })
    }

    const existing = await db.question.findUnique({ where: { id: questionId } })
    if (!existing) {
      return NextResponse.json({ error: 'Question non trouvée' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    const allowedFields = ['texte', 'bonneReponse', 'categorie', 'difficulte', 'mediaType', 'signImage', 'scenarioImage', 'videoUrl', 'audioFr', 'explication', 'points', 'tempsEstime', 'actif']

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    // Handle JSON fields separately
    if (body.options && Array.isArray(body.options)) {
      updateData.options = JSON.stringify(body.options)
    }
    if (body.tags && Array.isArray(body.tags)) {
      updateData.tags = JSON.stringify(body.tags)
    }

    const updated = await db.question.update({
      where: { id: questionId },
      data: updateData,
    })

    return NextResponse.json({ question: updated })
  } catch (error) {
    console.error('Admin question update error:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
