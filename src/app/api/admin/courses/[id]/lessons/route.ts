import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

// ─── GET: List lessons of a course ───────────────────────
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'administration' && session.role !== 'super-admin')) {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 })
    }

    const { id } = await params
    const lessons = await db.lesson.findMany({
      where: { courseId: id },
      orderBy: { ordre: 'asc' },
    })

    return NextResponse.json({ lessons })
  } catch (error) {
    console.error('Admin lessons list error:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}

// ─── POST: Add a lesson to a course ──────────────────────
export async function POST(
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
    const { titre, description, type, contenu, mediaUrl, signImage, scenarioImage, duree, ordre } = body

    if (!titre || !contenu) {
      return NextResponse.json({
        error: 'Champs requis: titre, contenu',
      }, { status: 400 })
    }

    const course = await db.course.findUnique({ where: { id } })
    if (!course) {
      return NextResponse.json({ error: 'Cours non trouvé' }, { status: 404 })
    }

    // Determine ordre if not provided
    let finalOrdre = ordre
    if (finalOrdre === undefined) {
      const last = await db.lesson.findFirst({
        where: { courseId: id },
        orderBy: { ordre: 'desc' },
      })
      finalOrdre = last ? last.ordre + 1 : 1
    }

    const lesson = await db.lesson.create({
      data: {
        courseId: id,
        titre,
        description: description || '',
        type: type || 'text',
        contenu,
        mediaUrl: mediaUrl || null,
        signImage: signImage || null,
        scenarioImage: scenarioImage || null,
        duree: duree || 5,
        ordre: finalOrdre,
      },
    })

    // Update course dureeTotale
    const allLessons = await db.lesson.findMany({ where: { courseId: id } })
    const totalDuration = allLessons.reduce((sum, l) => sum + l.duree, 0)
    await db.course.update({ where: { id }, data: { dureeTotale: totalDuration } })

    return NextResponse.json({ lesson }, { status: 201 })
  } catch (error) {
    console.error('Admin lesson create error:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
