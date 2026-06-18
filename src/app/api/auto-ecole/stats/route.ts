// ============================================================
// CodeRoute Guinée — Auto-école stats endpoint
// GET /api/auto-ecole/stats — KPIs + monthly breakdown for the
// dashboard of an auto-ecole user.
// ============================================================

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Authentification requise' }, { status: 401 })
  }
  if (session.role !== 'auto-ecole' && session.role !== 'super-admin') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  // ─── KPIs ──────────────────────────────────────────────
  const totalStudents = await db.user.count({ where: { role: 'candidat' } })
  const activeStudents = await db.user.count({
    where: { role: 'candidat', actif: true },
  })

  // Total exam sessions for candidats
  const examSessions = await db.examSession.findMany({
    select: { id: true, statut: true, score: true, totalQuestions: true, date: true },
  })
  const totalExams = examSessions.length
  const passedExams = examSessions.filter((e) => e.statut === 'reussi').length
  const successRate = totalExams > 0 ? Math.round((passedExams / totalExams) * 100) : 0

  // Upcoming exams (next 7 days)
  const now = new Date()
  const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const upcomingExams = examSessions.filter((e) => {
    const d = new Date(e.date)
    return d >= now && d <= sevenDaysLater && e.statut === 'programme'
  }).length

  // ─── Monthly breakdown (last 6 months) ─────────────────
  const monthlyData: Array<{ month: string; exams: number; passed: number }> = []
  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59)

    const monthExams = examSessions.filter((e) => {
      const d = new Date(e.date)
      return d >= monthStart && d <= monthEnd
    })

    monthlyData.push({
      month: monthStart.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
      exams: monthExams.length,
      passed: monthExams.filter((e) => e.statut === 'reussi').length,
    })
  }

  return NextResponse.json({
    kpi: {
      totalStudents,
      activeStudents,
      totalExams,
      passedExams,
      successRate,
      upcomingExams,
    },
    monthlyData,
  })
}
