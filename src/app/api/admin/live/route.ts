// ============================================================
// GET /api/admin/live
// Returns real-time KPIs + recent activity feed for the admin dashboard.
// Designed to be polled every 15-30s by the live dashboard widget.
// ============================================================

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'administration' && session.role !== 'super-admin')) {
      return NextResponse.json(
        { error: 'Accès réservé aux administrateurs' },
        { status: 403 }
      )
    }

    // ─── Live KPIs (computed fresh on every request) ───────
    const now = new Date()
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const [
      totalCandidates,
      activeToday,
      newCandidatesThisWeek,
      bookingsToday,
      bookingsThisWeek,
      pendingPayments,
      successfulPaymentsToday,
      failedPaymentsToday,
      activeExams,
      fraudAlertsActive,
      confirmedBookings,
      totalExamSessions,
    ] = await Promise.all([
      db.user.count({ where: { role: 'candidat' } }),
      db.user.count({
        where: {
          role: 'candidat',
          OR: [
            { examSessions: { some: { createdAt: { gte: last24h } } } },
            { bookings: { some: { createdAt: { gte: last24h } } } },
          ],
        },
      }),
      db.user.count({ where: { role: 'candidat', createdAt: { gte: last7d } } }),
      db.booking.count({ where: { createdAt: { gte: last24h } } }),
      db.booking.count({ where: { createdAt: { gte: last7d } } }),
      db.booking.count({ where: { statutPaiement: 'en_attente' } }),
      db.booking.count({
        where: { statutPaiement: 'confirme', createdAt: { gte: last24h } },
      }),
      db.booking.count({
        where: { statutPaiement: 'echoue', createdAt: { gte: last24h } },
      }),
      db.examSession.count({
        where: { statut: 'en_cours', createdAt: { gte: last24h } },
      }),
      db.fraudAlert.count({ where: { status: 'active' } }),
      db.booking.count({ where: { statutPaiement: 'confirme' } }),
      db.examSession.count(),
    ])

    // Bookings confirmed but with no ExamSession yet = results pending
    const pendingResults = Math.max(0, confirmedBookings - totalExamSessions)

    // ─── Activity feed (last 20 events across sources) ─────
    const [recentBookings, recentExams, recentUsers, recentFraud] = await Promise.all([
      db.booking.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: { candidat: { select: { prenom: true, nom: true, email: true } } },
      }),
      db.examSession.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { candidat: { select: { prenom: true, nom: true, email: true } } },
      }),
      db.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        where: { role: 'candidat' },
        select: { id: true, prenom: true, nom: true, email: true, createdAt: true },
      }),
      db.fraudAlert.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' },
        include: { candidat: { select: { prenom: true, nom: true, email: true } } },
      }),
    ])

    type FeedItem = {
      id: string
      type: 'booking' | 'payment' | 'exam' | 'user' | 'fraud'
      timestamp: string
      title: string
      subtitle: string
      status?: 'success' | 'pending' | 'failed' | 'active' | 'info'
      amount?: number
    }

    const feed: FeedItem[] = []

    for (const b of recentBookings) {
      feed.push({
        id: `booking-${b.id}`,
        type: 'booking',
        timestamp: b.createdAt.toISOString(),
        title: `Réservation — ${b.candidat.prenom} ${b.candidat.nom}`,
        subtitle: `${b.montant.toLocaleString('fr-FR')} GNF · ${b.centreNom} · ${b.statutPaiement}`,
        status:
          b.statutPaiement === 'confirme'
            ? 'success'
            : b.statutPaiement === 'en_attente'
            ? 'pending'
            : b.statutPaiement === 'echoue'
            ? 'failed'
            : 'info',
        amount: b.montant,
      })
    }

    for (const e of recentExams) {
      feed.push({
        id: `exam-${e.id}`,
        type: 'exam',
        timestamp: e.createdAt.toISOString(),
        title: `Examen — ${e.candidat.prenom} ${e.candidat.nom}`,
        subtitle:
          e.statut === 'en_cours'
            ? 'En cours'
            : e.statut === 'programme'
            ? `Programmé · ${e.centreNom}`
            : `${e.score ?? 0}/${e.totalQuestions ?? 40} · ${e.statut}`,
        status: e.statut === 'reussi' ? 'success' : e.statut === 'echoue' ? 'failed' : 'info',
      })
    }

    for (const u of recentUsers) {
      feed.push({
        id: `user-${u.id}`,
        type: 'user',
        timestamp: u.createdAt.toISOString(),
        title: `Nouvel inscrit — ${u.prenom} ${u.nom}`,
        subtitle: u.email,
        status: 'info',
      })
    }

    for (const f of recentFraud) {
      const name = f.candidat ? `${f.candidat.prenom} ${f.candidat.nom}` : 'Anonyme'
      feed.push({
        id: `fraud-${f.id}`,
        type: 'fraud',
        timestamp: f.createdAt.toISOString(),
        title: `Alerte fraude — ${name}`,
        subtitle: `${f.type} · ${f.severity}`,
        status: 'active',
      })
    }

    feed.sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    const topFeed = feed.slice(0, 20)

    return NextResponse.json({
      timestamp: now.toISOString(),
      kpis: {
        totalCandidates,
        activeToday,
        newCandidatesThisWeek,
        bookingsToday,
        bookingsThisWeek,
        pendingPayments,
        successfulPaymentsToday,
        failedPaymentsToday,
        activeExams,
        fraudAlertsActive,
        pendingResults,
      },
      feed: topFeed,
    })
  } catch (err) {
    console.error('[/api/admin/live] error:', err)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
