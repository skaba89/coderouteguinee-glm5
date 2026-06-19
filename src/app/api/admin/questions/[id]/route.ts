import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { logAudit } from '@/lib/audit-log'

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

    await logAudit({
      eventType: 'QUESTION_UPDATE',
      userId: session.userId,
      userRole: session.role,
      description: `Question updated: #${questionId}`,
      targetType: 'question',
      targetId: String(questionId),
    }, request)

    return NextResponse.json({ question: updated })
  } catch (error) {
    console.error('Admin question update error:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}

// ─── DELETE: Delete a question (admin only) ───────────────
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'administration' && session.role !== 'super-admin')) {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 })
    }

    const { id } = await params
    const questionId = parseInt(id)
    if (isNaN(questionId)) {
      return NextResponse.json({ error: 'ID de question invalide' }, { status: 400 })
    }

    const existing = await db.question.findUnique({ where: { id: questionId } })
    if (!existing) {
      return NextResponse.json({ error: 'Question non trouvée' }, { status: 404 })
    }

    // Check if question is referenced in any response (foreign key constraint)
    const reponsesCount = await db.reponse.count({ where: { questionId } })
    if (reponsesCount > 0) {
      // Soft-delete: deactivate instead of deleting
      await db.question.update({
        where: { id: questionId },
        data: { actif: false },
      })
      await logAudit({
        eventType: 'QUESTION_DELETE',
        userId: session.userId,
        userRole: session.role,
        description: `Question #${questionId} soft-deleted (used in ${reponsesCount} responses)`,
        targetType: 'question',
        targetId: String(questionId),
      }, _request)
      return NextResponse.json({
        success: true,
        softDeleted: true,
        message: `Question désactivée (utilisée dans ${reponsesCount} réponse(s) — ne peut pas être supprimée définitivement)`,
      })
    }

    await db.question.delete({ where: { id: questionId } })
    await logAudit({
      eventType: 'QUESTION_DELETE',
      userId: session.userId,
      userRole: session.role,
      description: `Question #${questionId} deleted permanently`,
      targetType: 'question',
      targetId: String(questionId),
    }, _request)
    return NextResponse.json({ success: true, deleted: true })
  } catch (error) {
    console.error('Admin question delete error:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
