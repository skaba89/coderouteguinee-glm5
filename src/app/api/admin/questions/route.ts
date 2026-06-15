import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

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

    return NextResponse.json({ question }, { status: 201 })
  } catch (error) {
    console.error('Admin question create error:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
