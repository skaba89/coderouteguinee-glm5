import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

// ─── GET: Admin dashboard statistics ───────────────────────
export async function GET() {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'administration' && session.role !== 'super-admin')) {
      return NextResponse.json(
        { error: 'Accès réservé aux administrateurs' },
        { status: 403 }
      )
    }

    // ─── KPI Stats ──────────────────────────────────────────
    const totalCandidates = await db.user.count({ where: { role: 'candidat' } })
    const totalExams = await db.examSession.count()
    const passedExams = await db.examSession.count({ where: { statut: 'reussi' } })
    const totalCentres = await db.centre.count({ where: { actif: true } })

    // ─── Recent daily stats ─────────────────────────────────
    const recentStats = await db.dailyStat.findMany({
      orderBy: { date: 'desc' },
      take: 30,
    })

    const totalRevenue = recentStats.reduce((sum, s) => sum + s.revenue, 0)
    const avgSuccessRate = totalExams > 0 ? Math.round((passedExams / totalExams) * 100) : 0

    // ─── Fraud alerts ───────────────────────────────────────
    const activeFraudAlerts = await db.fraudAlert.count({ where: { status: 'active' } })
    const fraudAlertsBySeverity = await db.fraudAlert.groupBy({
      by: ['severity'],
      _count: { id: true },
      where: { status: { in: ['active', 'investigating'] } },
    })

    // ─── Centres with accreditation ──────────────────────────
    const centres = await db.centre.findMany({
      where: { actif: true },
      orderBy: { accredScore: 'desc' },
    })

    // ─── Monthly exam volume from daily stats ───────────────
    const monthlyData: Record<string, { total: number; passed: number; revenue: number }> = {}
    for (const stat of recentStats) {
      const monthKey = stat.date.substring(0, 7)
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { total: 0, passed: 0, revenue: 0 }
      }
      monthlyData[monthKey].total += stat.exams
      monthlyData[monthKey].passed += stat.passed
      monthlyData[monthKey].revenue += stat.revenue
    }

    const monthlyExamVolume = Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        totalExamens: data.total,
        reussis: data.passed,
        revenue: data.revenue,
      }))

    // ─── Regional stats ─────────────────────────────────────
    const allCentres = await db.centre.findMany({ where: { actif: true } })
    const regionMap: Record<string, { centres: number; exams: number; passed: number; revenue: number }> = {}
    
    for (const centre of allCentres) {
      if (!regionMap[centre.region]) {
        regionMap[centre.region] = { centres: 0, exams: 0, passed: 0, revenue: 0 }
      }
      regionMap[centre.region].centres++
    }

    const examSessions = await db.examSession.findMany({
      include: { centre: { select: { region: true } } },
    })
    for (const exam of examSessions) {
      const region = exam.centre?.region
      if (region && regionMap[region]) {
        regionMap[region].exams++
        if (exam.statut === 'reussi') regionMap[region].passed++
        regionMap[region].revenue += 50000
      }
    }

    const regionalStats = Object.entries(regionMap).map(([region, data]) => ({
      region,
      centres: data.centres,
      candidates: data.exams,
      examsPassed: data.passed,
      successRate: data.exams > 0 ? Math.round((data.passed / data.exams) * 100) : 0,
      revenue: data.revenue,
    }))

    // ─── Fraud alerts with details ──────────────────────────
    const fraudAlerts = await db.fraudAlert.findMany({
      where: { status: { in: ['active', 'investigating'] } },
      include: {
        candidat: { select: { id: true, nom: true, prenom: true, numeroUnique: true } },
        centre: { select: { id: true, nom: true, ville: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    // ─── Category performance ───────────────────────────────
    // `correcte` is a Boolean, which Prisma cannot `_sum`. So we issue
    // two `_count` aggregations grouped by questionId: one for all
    // responses, one filtered to correct responses only.
    const [totalByQuestion, correctByQuestion] = await Promise.all([
      db.reponse.groupBy({
        by: ['questionId'],
        _count: { id: true },
      }),
      db.reponse.groupBy({
        by: ['questionId'],
        _count: { id: true },
        where: { correcte: true },
      }),
    ])

    const questionIds = totalByQuestion.map(cp => cp.questionId)
    const questions = await db.question.findMany({
      where: { id: { in: questionIds } },
      select: { id: true, categorie: true },
    })
    const questionCategoryMap = Object.fromEntries(questions.map(q => [q.id, q.categorie]))
    const correctMap = new Map(correctByQuestion.map(cp => [cp.questionId, cp._count.id]))

    const categoryScores: Record<string, { total: number; correct: number }> = {}
    for (const cp of totalByQuestion) {
      const cat = questionCategoryMap[cp.questionId] || 'Autre'
      if (!categoryScores[cat]) categoryScores[cat] = { total: 0, correct: 0 }
      const total = cp._count?.id ?? 0
      const correct = correctMap.get(cp.questionId) ?? 0
      categoryScores[cat].total += total
      categoryScores[cat].correct += correct
    }

    const categoryData = Object.entries(categoryScores).map(([categorie, data]) => ({
      categorie,
      score: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
    }))

    return NextResponse.json({
      kpi: {
        totalCandidates,
        totalExams,
        passedExams,
        totalCentres,
        totalRevenue,
        avgSuccessRate,
        activeFraudAlerts,
      },
      monthlyExamVolume,
      regionalStats,
      fraudAlerts,
      centres: centres.map(c => ({
        ...c,
        equipements: c.equipements ? JSON.parse(c.equipements) : [],
        languesDisponibles: JSON.parse(c.languesDisponibles),
      })),
      categoryScores: categoryData,
      fraudBySeverity: fraudAlertsBySeverity,
      dailyStats: recentStats,
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
