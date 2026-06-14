import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionFromRequest } from '@/lib/session'

// ─── GET: Get exam sessions for the current candidate ──────
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: Record<string, unknown> = { candidatId: session.userId }
    if (status) {
      where.statut = status
    }

    const examSessions = await db.examSession.findMany({
      where,
      orderBy: { date: 'desc' },
      take: limit,
    })

    // Get bookings for this candidate
    const bookings = await db.booking.findMany({
      where: { candidatId: session.userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    // Calculate stats
    const totalExams = await db.examSession.count({ where: { candidatId: session.userId } })
    const passedExams = await db.examSession.count({ 
      where: { candidatId: session.userId, statut: 'reussi' } 
    })
    const failedExams = await db.examSession.count({ 
      where: { candidatId: session.userId, statut: 'echoue' } 
    })

    // Best score
    const bestSession = await db.examSession.findFirst({
      where: { candidatId: session.userId, score: { not: null } },
      orderBy: { score: 'desc' },
      select: { score: true, totalQuestions: true },
    })

    // Upcoming exam
    const upcomingExam = await db.examSession.findFirst({
      where: { candidatId: session.userId, statut: 'programme' },
      orderBy: { date: 'asc' },
    })

    return NextResponse.json({
      examSessions,
      bookings,
      stats: {
        totalExams,
        passedExams,
        failedExams,
        successRate: totalExams > 0 ? Math.round((passedExams / totalExams) * 100) : 0,
        bestScore: bestSession ? `${bestSession.score}/${bestSession.totalQuestions}` : null,
        upcomingExam: upcomingExam ? {
          date: upcomingExam.date,
          heure: upcomingExam.heure,
          centreNom: upcomingExam.centreNom,
        } : null,
      },
    })
  } catch (error) {
    console.error('Candidate exams fetch error:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
