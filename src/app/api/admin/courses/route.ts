import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { logAudit } from '@/lib/audit-log'

// ─── GET: List all courses (admin only, includes drafts/archived) ──
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'administration' && session.role !== 'super-admin')) {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || undefined
    const categorie = searchParams.get('categorie') || undefined
    const search = searchParams.get('search') || undefined

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (categorie) where.categorie = categorie
    if (search) where.titre = { contains: search }

    const courses = await db.course.findMany({
      where,
      include: { _count: { select: { lessons: true } } },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ courses })
  } catch (error) {
    console.error('Admin courses list error:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}

// ─── POST: Create a new course (admin only) ──────────────
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'administration' && session.role !== 'super-admin')) {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 })
    }

    const body = await request.json()
    const { titre, description, categorie, status, imageCover, dureeTotale } = body

    if (!titre || !description || !categorie) {
      return NextResponse.json({
        error: 'Champs requis: titre, description, categorie',
      }, { status: 400 })
    }

    const validStatuses = ['brouillon', 'publie', 'archive']
    const finalStatus = validStatuses.includes(status) ? status : 'brouillon'

    const course = await db.course.create({
      data: {
        titre,
        description,
        categorie,
        status: finalStatus,
        imageCover: imageCover || null,
        dureeTotale: dureeTotale || 0,
      },
    })

    await logAudit({
      eventType: 'COURSE_CREATE',
      userId: session.userId,
      userRole: session.role,
      description: `Course created: ${course.titre} (${course.id})`,
    }, request)

    return NextResponse.json({ course }, { status: 201 })
  } catch (error) {
    console.error('Admin course create error:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
