import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categorie = searchParams.get('categorie')
    const actif = searchParams.get('actif')
    const countParam = searchParams.get('count')
    const random = searchParams.get('random')
    const mediaType = searchParams.get('mediaType') // text | sign | scenario | video | media | audio

    // Build where clause
    const where: Record<string, unknown> = {}
    if (categorie) {
      where.categorie = categorie
    }
    if (actif !== null) {
      where.actif = actif === 'true'
    }
    // Media filter — 'media' is a special value meaning "any question with media"
    // (sign, scenario, or video — excludes plain text questions)
    // 'audio' is a special value meaning "any question with a French narration (audioFr not null)"
    if (mediaType === 'media') {
      where.mediaType = { in: ['sign', 'scenario', 'video', 'sign+scenario'] }
    } else if (mediaType === 'audio') {
      where.audioFr = { not: null }
    } else if (mediaType && mediaType !== 'all') {
      where.mediaType = mediaType
    }

    // Get total count
    const totalCount = await db.question.count({ where })

    if (random === 'true') {
      // Fetch all matching question IDs
      const allQuestions = await db.question.findMany({
        where,
        select: { id: true },
        orderBy: { id: 'asc' },
      })

      // Shuffle and pick random subset
      const ids = allQuestions.map((q) => q.id)
      for (let i = ids.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[ids[i], ids[j]] = [ids[j], ids[i]]
      }

      const limit = countParam ? parseInt(countParam, 10) : ids.length
      const selectedIds = ids.slice(0, limit)

      const questions = await db.question.findMany({
        where: {
          ...where,
          id: { in: selectedIds },
        },
      })

      // Parse JSON string fields back to arrays
      const parsedQuestions = questions.map((q) => ({
        ...q,
        options: JSON.parse(q.options),
        tags: JSON.parse(q.tags),
      }))

      return NextResponse.json({
        questions: parsedQuestions,
        total: totalCount,
      })
    }

    // Non-random: return all matching questions
    const questions = await db.question.findMany({
      where,
      orderBy: { id: 'asc' },
      ...(countParam ? { take: parseInt(countParam, 10) } : {}),
    })

    // Parse JSON string fields back to arrays
    const parsedQuestions = questions.map((q) => ({
      ...q,
      options: JSON.parse(q.options),
      tags: JSON.parse(q.tags),
    }))

    return NextResponse.json({
      questions: parsedQuestions,
      total: totalCount,
    })
  } catch (error) {
    console.error('Questions fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
