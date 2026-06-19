import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { logAudit } from '@/lib/audit-log'

// ─── GET: Get a course with its lessons ──────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'administration' && session.role !== 'super-admin')) {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 })
    }

    const { id } = await params
    const course = await db.course.findUnique({
      where: { id },
      include: { lessons: { orderBy: { ordre: 'asc' } } },
    })

    if (!course) {
      return NextResponse.json({ error: 'Cours non trouvé' }, { status: 404 })
    }

    return NextResponse.json({ course })
  } catch (error) {
    console.error('Admin course fetch error:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}

// ─── PATCH: Update a course ──────────────────────────────
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

    const existing = await db.course.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Cours non trouvé' }, { status: 404 })
    }

    const allowedFields = ['titre', 'description', 'categorie', 'status', 'imageCover', 'dureeTotale']
    const updateData: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) updateData[field] = body[field]
    }

    if (updateData.status && !['brouillon', 'publie', 'archive'].includes(updateData.status as string)) {
      return NextResponse.json({ error: 'Statut invalide' }, { status: 400 })
    }

    const updated = await db.course.update({ where: { id }, data: updateData })

    await logAudit({
      eventType: 'COURSE_UPDATE',
      userId: session.userId,
      userRole: session.role,
      description: `Course updated: ${updated.titre} (${id})`,
    }, request)

    return NextResponse.json({ course: updated })
  } catch (error) {
    console.error('Admin course update error:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}

// ─── DELETE: Delete a course (cascade deletes lessons) ───
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'administration' && session.role !== 'super-admin')) {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 })
    }

    const { id } = await params
    const existing = await db.course.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Cours non trouvé' }, { status: 404 })
    }

    await db.course.delete({ where: { id } })

    await logAudit({
      eventType: 'COURSE_DELETE',
      userId: session.userId,
      userRole: session.role,
      description: `Course deleted: ${existing.titre} (${id})`,
    }, request)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin course delete error:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
