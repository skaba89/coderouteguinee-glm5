import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

// ─── PATCH: Update a lesson ──────────────────────────────
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; lessonId: string }> }
) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'administration' && session.role !== 'super-admin')) {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 })
    }

    const { id, lessonId } = await params
    const body = await request.json()

    const existing = await db.lesson.findUnique({ where: { id: lessonId } })
    if (!existing || existing.courseId !== id) {
      return NextResponse.json({ error: 'Leçon non trouvée' }, { status: 404 })
    }

    const allowedFields = ['titre', 'description', 'type', 'contenu', 'mediaUrl', 'signImage', 'scenarioImage', 'duree', 'ordre']
    const updateData: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) updateData[field] = body[field]
    }

    const updated = await db.lesson.update({ where: { id: lessonId }, data: updateData })

    // Update course dureeTotale if duree changed
    if (updateData.duree !== undefined) {
      const allLessons = await db.lesson.findMany({ where: { courseId: id } })
      const totalDuration = allLessons.reduce((sum, l) => sum + l.duree, 0)
      await db.course.update({ where: { id }, data: { dureeTotale: totalDuration } })
    }

    return NextResponse.json({ lesson: updated })
  } catch (error) {
    console.error('Admin lesson update error:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}

// ─── DELETE: Delete a lesson ─────────────────────────────
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; lessonId: string }> }
) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'administration' && session.role !== 'super-admin')) {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 })
    }

    const { id, lessonId } = await params
    const existing = await db.lesson.findUnique({ where: { id: lessonId } })
    if (!existing || existing.courseId !== id) {
      return NextResponse.json({ error: 'Leçon non trouvée' }, { status: 404 })
    }

    await db.lesson.delete({ where: { id: lessonId } })

    // Recalculate course dureeTotale
    const allLessons = await db.lesson.findMany({ where: { courseId: id } })
    const totalDuration = allLessons.reduce((sum, l) => sum + l.duree, 0)
    await db.course.update({ where: { id }, data: { dureeTotale: totalDuration } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin lesson delete error:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
