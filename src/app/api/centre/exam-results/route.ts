// ============================================================
// CodeRoute Guinée — Centre exam result submission
// POST /api/centre/exam-results — submit exam score (auto pass/fail)
// Threshold: 87.5% (35/40) — official Guinea code threshold
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { logAudit } from '@/lib/audit-log'

export const dynamic = 'force-dynamic'

const PASS_THRESHOLD = 0.875 // 87.5%

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Authentification requise' }, { status: 401 })
  }
  if (session.role !== 'centre-agree' && session.role !== 'super-admin') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const body = await request.json()
  const { sessionId, score, totalQuestions, dureeEffective } = body as {
    sessionId: string
    score: number
    totalQuestions?: number
    dureeEffective?: number
  }

  if (!sessionId || typeof score !== 'number') {
    return NextResponse.json(
      { error: 'sessionId et score (number) requis' },
      { status: 400 }
    )
  }

  const examSession = await db.examSession.findUnique({ where: { id: sessionId } })
  if (!examSession) {
    return NextResponse.json({ error: 'Session d\'examen introuvable' }, { status: 404 })
  }

  const total = totalQuestions || examSession.totalQuestions || 40
  const percentage = score / total
  const newStatut = percentage >= PASS_THRESHOLD ? 'reussi' : 'echoue'

  const updated = await db.examSession.update({
    where: { id: sessionId },
    data: {
      score,
      totalQuestions: total,
      statut: newStatut,
      dureeEffective: dureeEffective || examSession.dureeEffective,
    },
  })

  await logAudit({
    eventType: 'EXAM_RESULT_SUBMIT',
    description: `Résultat soumis pour session ${sessionId}: ${score}/${total} (${newStatut})`,
    userId: session.userId,
    userRole: session.role,
    targetId: sessionId,
    targetType: 'ExamSession',
    details: { score, total, percentage, statut: newStatut },
  }, request)

  return NextResponse.json({
    session: updated,
    percentage: Math.round(percentage * 100),
    passed: newStatut === 'reussi',
    threshold: Math.round(PASS_THRESHOLD * 100),
  })
}
