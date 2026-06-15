import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const dailyStats = await db.dailyStat.findMany({
      orderBy: { date: 'desc' },
    })

    // Aggregate totals
    const totalExams = dailyStats.reduce((sum, s) => sum + s.exams, 0)
    const totalPassed = dailyStats.reduce((sum, s) => sum + s.passed, 0)
    const totalRevenue = dailyStats.reduce((sum, s) => sum + s.revenue, 0)

    // Calculate weighted average score
    const avgScore =
      totalExams > 0
        ? dailyStats.reduce((sum, s) => sum + s.avgScore * s.exams, 0) /
          totalExams
        : 0

    return NextResponse.json({
      totalExams,
      totalPassed,
      avgScore: Math.round(avgScore * 100) / 100,
      revenue: totalRevenue,
      dailyStats,
    })
  } catch (error) {
    console.error('Stats fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
