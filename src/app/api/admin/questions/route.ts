import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { logAudit } from '@/lib/audit-log'

// ─── GET: List questions with filters (admin only) ────────
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'administration' && session.role !== 'super-admin')) {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const categorie = searchParams.get('categorie') || undefined
    const difficulte = searchParams.get('difficulte') || undefined
    const mediaType = searchParams.get('mediaType') || undefined
    const actif = searchParams.get('actif')
    const search = searchParams.get('search') || undefined
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (categorie) where.categorie = categorie
    if (difficulte) where.difficulte = difficulte
    if (mediaType && mediaType !== 'all') where.mediaType = mediaType
    if (actif !== null && actif !== undefined) where.actif = actif === 'true'
    if (search) where.texte = { contains: search }

    const [questions, total] = await Promise.all([
      db.question.findMany({
        where,
        orderBy: { id: 'desc' },
        skip,
        take: limit,
      }),
      db.question.count({ where }),
    ])

    const parsed = questions.map((q) => ({
      ...q,
      options: JSON.parse(q.options),
      tags: JSON.parse(q.tags),
    }))

    return NextResponse.json({
      questions: parsed,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('Admin questions list error:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}

// ─── POST: Create a new question (admin only) ─────────────
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'administration' && session.role !== 'super-admin')) {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 })
    }

    const body = await request.json()
    const { texte, options, bonneReponse, categorie, difficulte, explication, points, tempsEstime, tags, mediaType, signImage, scenarioImage } = body

    if (!texte || !options || bonneReponse === undefined || !categorie || !explication) {
      return NextResponse.json({ error: 'Champs requis manquants: texte, options, bonneReponse, categorie, explication' }, { status: 400 })
    }

    if (!Array.isArray(options) || options.length < 2) {
      return NextResponse.json({ error: 'Au moins 2 options requises' }, { status: 400 })
    }

    if (bonneReponse < 0 || bonneReponse >= options.length) {
      return NextResponse.json({ error: 'Index de bonneReponse invalide' }, { status: 400 })
    }

    const validCategories = ['Signalisation', 'Priorités', 'Conduite', 'Sécurité', 'Infractions']
    if (!validCategories.includes(categorie)) {
      return NextResponse.json({ error: `Catégorie invalide. Valeurs acceptées: ${validCategories.join(', ')}` }, { status: 400 })
    }

    const question = await db.question.create({
      data: {
        texte,
        options: JSON.stringify(options),
        bonneReponse,
        categorie,
        difficulte: difficulte || 'facile',
        mediaType: mediaType || 'text',
        signImage: signImage || null,
        scenarioImage: scenarioImage || null,
        explication,
        points: points || 1,
        tempsEstime: tempsEstime || 20,
        tags: JSON.stringify(tags || []),
      },
    })

    await logAudit({
      eventType: 'QUESTION_CREATE',
      userId: session.userId,
      userRole: session.role,
      description: `Question created: #${question.id} (${categorie})`,
      targetType: 'question',
      targetId: String(question.id),
    }, request)

    return NextResponse.json({ question }, { status: 201 })
  } catch (error) {
    console.error('Admin question create error:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
