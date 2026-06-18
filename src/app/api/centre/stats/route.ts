// ============================================================
// CodeRoute Guinée — Centre stats endpoint
// GET /api/centre/stats — KPIs + monthly + 7-day schedule
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
  if (session.role !== 'centre-agree' && session.role !== 'super-admin') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  // ─── KPIs ──────────────────────────────────────────────
  const totalBookings = await db.booking.count()
  const confirmedBookings = await db.booking.count({ where: { confirmee: true } })
  const pendingBookings = await db.booking.count({
    where: { statutPaiement: 'en_attente' },
  })

  // Revenue from confirmed bookings
  const confirmed = await db.booking.findMany({
    where: { confirmee: true, statutPaiement: 'confirme' },
    select: { montant: true },
  })
  const totalRevenue = confirmed.reduce((sum, b) => sum + b.montant, 0)

  // Today's exams
  const todayStr = new Date().toISOString().split('T')[0]
  const todayBookings = await db.booking.count({
    where: { date: todayStr, confirmee: true },
  })

  // ─── 7-day schedule ────────────────────────────────────
  const now = new Date()
  const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const schedule = await db.booking.findMany({
    where: {
      confirmee: true,
      date: { gte: todayStr },
    },
    include: {
      candidat: {
        select: { nom: true, prenom: true, numeroUnique: true, categoriePermis: true },
      },
    },
    orderBy: { date: 'asc' },
    take: 50,
  })

  const upcomingSchedule = schedule
    .filter((b) => new Date(b.date) <= sevenDaysLater)
    .map((b) => ({
      id: b.id,
      date: b.date,
      heure: b.heure,
      candidat: `${b.candidat.prenom} ${b.candidat.nom}`,
      numeroUnique: b.candidat.numeroUnique,
      categoriePermis: b.candidat.categoriePermis,
      langue: b.langue,
    }))

  // ─── Monthly breakdown ─────────────────────────────────
  const monthlyData: Array<{ month: string; bookings: number; revenue: number }> = []
  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59)

    const monthBookings = await db.booking.findMany({
      where: {
        createdAt: { gte: monthStart, lte: monthEnd },
        confirmee: true,
      },
      select: { montant: true },
    })

    monthlyData.push({
      month: monthStart.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
      bookings: monthBookings.length,
      revenue: monthBookings.reduce((s, b) => s + b.montant, 0),
    })
  }

  return NextResponse.json({
    kpi: {
      totalBookings,
      confirmedBookings,
      pendingBookings,
      todayBookings,
      totalRevenue,
    },
    upcomingSchedule,
    monthlyData,
  })
}
