#!/usr/bin/env tsx
// ============================================================
// CodeRoute Guinée — Pilot weekly KPI extraction
// ============================================================
// Extracts weekly KPIs from the PostgreSQL database (and optionally
// Prometheus for uptime/latency) and writes a structured JSON file
// to reports/pilot-kpi-S{N}-{YYYY-MM-DD}.json.
//
// The output is consumed by scripts/pilot-weekly-report.ts to
// generate the Markdown/PDF weekly report.
//
// Schema (verified against prisma/schema.prisma):
//   - User              → candidates (role="candidat"), actif flag
//   - Booking           → reservations + payments (statutPaiement, moyenPaiement, montant)
//   - ExamSession       → exams (statut: programme|en_cours|passe|reussi|echoue|annule, score)
//   - FraudAlert        → fraud alerts (severity: info|low|medium|high|critical)
//   - AuditLog          → security events (timestamp field, NOT createdAt)
//   - Centre            → pilot centres (capacite field, NOT capaciteJour)
//
// Usage:
//   npx tsx scripts/pilot-kpi-extract.ts --week=1
//   npx tsx scripts/pilot-kpi-extract.ts --week=1 --prometheus=http://prometheus:9090
//
// Env:
//   DATABASE_URL          — PostgreSQL connection string
//   PILOT_START_DATE      — ISO date of week 1 Monday (e.g. 2026-01-05)
//   PROMETHEUS_URL        — optional, for uptime/latency KPIs
// ============================================================

import { db } from '../src/lib/db'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

// ---------- CLI args ----------
const args = process.argv.slice(2)
function arg(name: string, fallback?: string): string | undefined {
  const found = args.find((a) => a.startsWith(`--${name}=`))
  return found ? found.split('=')[1] : fallback
}

const weekNum = parseInt(arg('week', '1')!, 10)
if (!Number.isFinite(weekNum) || weekNum < 1 || weekNum > 12) {
  console.error('❌ --week must be an integer between 1 and 12')
  process.exit(1)
}

const pilotStartEnv = process.env.PILOT_START_DATE
if (!pilotStartEnv) {
  console.error('❌ PILOT_START_DATE env var required (ISO date, e.g. 2026-01-05)')
  process.exit(1)
}
const pilotStart = new Date(pilotStartEnv)
if (isNaN(pilotStart.getTime())) {
  console.error('❌ PILOT_START_DATE is not a valid ISO date')
  process.exit(1)
}

// Week N covers [pilotStart + (N-1)*7, pilotStart + N*7)
const weekStart = new Date(pilotStart)
weekStart.setDate(weekStart.getDate() + (weekNum - 1) * 7)
const weekEnd = new Date(weekStart)
weekEnd.setDate(weekEnd.getDate() + 7)

console.log(`📊 Extracting KPI for week ${weekNum}`)
console.log(`   Period: ${weekStart.toISOString()} → ${weekEnd.toISOString()}`)

// ---------- Helpers ----------
function iso(d: Date): string {
  return d.toISOString()
}

// ---------- KPI extraction ----------
async function extractKPI() {
  const t0 = Date.now()

  // --- 1. User acquisition & engagement ---
  const newUsersThisWeek = await db.user.count({
    where: {
      role: 'candidat',
      createdAt: { gte: weekStart, lt: weekEnd },
    },
  })
  const newUsersPrevWeek = await db.user.count({
    where: {
      role: 'candidat',
      createdAt: {
        gte: new Date(weekStart.getTime() - 7 * 86400_000),
        lt: weekStart,
      },
    },
  })
  // Active users = candidats with actif=true AND created before weekEnd
  const activeUsersCumulative = await db.user.count({
    where: { role: 'candidat', actif: true, createdAt: { lt: weekEnd } },
  })
  const totalUsers = await db.user.count({ where: { role: 'candidat' } })
  const totalUsersPilotStart = await db.user.count({
    where: { role: 'candidat', createdAt: { lt: weekStart } },
  })
  const abandonedUsers = await db.user.count({
    where: {
      actif: false,
      role: 'candidat',
      createdAt: { lt: weekStart },
    },
  })

  // --- 2. Exam performance (ExamSession) ---
  // Code exam sessions = sessions with totalQuestions > 0 and statut in {reussi, echoue, passe}
  const examSessionsThisWeek = await db.examSession.findMany({
    where: {
      createdAt: { gte: weekStart, lt: weekEnd },
      statut: { in: ['reussi', 'echoue', 'passe'] },
    },
    select: { statut: true, score: true, totalQuestions: true },
  })
  // Distinguish code vs conduite — schema doesn't have explicit type, use score presence
  // Heuristic: code exam if totalQuestions=40, conduite otherwise. Adjust if schema evolves.
  const codeSessions = examSessionsThisWeek.filter((e) => e.totalQuestions >= 30)
  const conduiteSessions = examSessionsThisWeek.filter((e) => e.totalQuestions < 30)

  const codePassed = codeSessions.filter((e) => e.statut === 'reussi').length
  const conduitePassed = conduiteSessions.filter((e) => e.statut === 'reussi').length
  const avgScoreCode = codeSessions.length
    ? codeSessions.reduce((s, e) => s + (e.score ?? 0), 0) / codeSessions.length
    : 0
  const avgScoreConduite = conduiteSessions.length
    ? conduiteSessions.reduce((s, e) => s + (e.score ?? 0), 0) / conduiteSessions.length
    : 0

  // --- 3. Payments (Booking) ---
  // Bookings with paiement this week
  const bookingsThisWeek = await db.booking.findMany({
    where: { createdAt: { gte: weekStart, lt: weekEnd } },
    select: { moyenPaiement: true, statutPaiement: true, montant: true },
  })

  // Map moyenPaiement → provider-like bucketing
  // Schema: moyenPaiement = mobile_money | cash | carte (single field)
  // To distinguish Orange vs MTN, we'd need to inspect numeroPaiement prefix
  // or a separate field. For now, report all mobile_money together.
  const mobileMoneyPayments = bookingsThisWeek.filter((b) => b.moyenPaiement === 'mobile_money')
  const cashPayments = bookingsThisWeek.filter((b) => b.moyenPaiement === 'cash')
  const cardPayments = bookingsThisWeek.filter((b) => b.moyenPaiement === 'carte')
  const paymentsSucceeded = bookingsThisWeek.filter((b) => b.statutPaiement === 'confirme')
  const paymentsFailed = bookingsThisWeek.filter((b) => b.statutPaiement === 'echoue')
  const paymentsRefunded = bookingsThisWeek.filter((b) => b.statutPaiement === 'rembourse')
  const totalVolumeGnf = paymentsSucceeded.reduce((s, b) => s + b.montant, 0)
  const failureRate = bookingsThisWeek.length
    ? (paymentsFailed.length / bookingsThisWeek.length) * 100
    : 0

  // --- 4. Bookings ---
  const bookingsCountThisWeek = bookingsThisWeek.length
  // Avg time between registration and first booking
  const usersWithBooking = await db.user.findMany({
    where: {
      role: 'candidat',
      bookings: { some: { createdAt: { lt: weekEnd } } },
      createdAt: { gte: pilotStart },
    },
    select: { createdAt: true, bookings: { orderBy: { createdAt: 'asc' }, take: 1 } },
  })
  const registrationDurations = usersWithBooking
    .filter((u) => u.bookings.length > 0)
    .map((u) => (u.bookings[0].createdAt.getTime() - u.createdAt.getTime()) / 86400_000)
  const avgDaysRegToBooking = registrationDurations.length
    ? registrationDurations.reduce((s, d) => s + d, 0) / registrationDurations.length
    : 0

  // --- 5. Centres pilot fill rate ---
  const centres = await db.centre.findMany({
    where: { actif: true },
    select: {
      id: true,
      nom: true,
      capacite: true,
      ville: true,
      region: true,
      bookings: { select: { id: true } },
    },
  })

  // --- 6. Security & fraud ---
  const fraudAlertsThisWeek = await db.fraudAlert.count({
    where: { createdAt: { gte: weekStart, lt: weekEnd } },
  })
  const fraudAlertsBySeverity = await db.fraudAlert.groupBy({
    by: ['severity'],
    where: { createdAt: { gte: weekStart, lt: weekEnd } },
    _count: true,
  })

  // --- 7. Audit log (rate limit, geoblock) ---
  // AuditLog uses 'timestamp' field, not createdAt
  const rateLimitEvents = await db.auditLog.count({
    where: {
      timestamp: { gte: weekStart, lt: weekEnd },
      eventType: { startsWith: 'RATE_LIMIT_' },
    },
  })
  const geoblockEvents = await db.auditLog.count({
    where: {
      timestamp: { gte: weekStart, lt: weekEnd },
      eventType: { startsWith: 'GEOBLOCK_' },
    },
  })

  // --- 8. Support tickets — no SupportTicket model exists in current schema
  // Set to 0 (placeholder for future schema extension)
  const ticketsOpen = 0
  const ticketsThisWeek = 0

  const t1 = Date.now()
  console.log(`   Queries executed in ${t1 - t0}ms`)

  // --- Build report object ---
  const report = {
    meta: {
      weekNum,
      pilotStartDate: iso(pilotStart),
      weekStart: iso(weekStart),
      weekEnd: iso(weekEnd),
      generatedAt: iso(new Date()),
      generator: 'pilot-kpi-extract.ts v1.0',
    },
    acquisition: {
      newUsersThisWeek,
      newUsersPrevWeek,
      delta: newUsersThisWeek - newUsersPrevWeek,
      deltaPct: newUsersPrevWeek
        ? ((newUsersThisWeek - newUsersPrevWeek) / newUsersPrevWeek) * 100
        : 0,
      activeUsersCumulative,
      totalUsers,
      cumulativeUsersEndOfWeek: totalUsersPilotStart + newUsersThisWeek,
      abandonedUsers,
      abandonRate: totalUsers ? (abandonedUsers / totalUsers) * 100 : 0,
    },
    exams: {
      code: {
        passed: codeSessions.length,
        succeeded: codePassed,
        successRate: codeSessions.length
          ? (codePassed / codeSessions.length) * 100
          : 0,
        avgScore: Number(avgScoreCode.toFixed(2)),
      },
      conduite: {
        passed: conduiteSessions.length,
        succeeded: conduitePassed,
        successRate: conduiteSessions.length
          ? (conduitePassed / conduiteSessions.length) * 100
          : 0,
        avgScore: Number(avgScoreConduite.toFixed(2)),
      },
    },
    payments: {
      total: bookingsThisWeek.length,
      mobileMoney: mobileMoneyPayments.length,
      cash: cashPayments.length,
      card: cardPayments.length,
      succeeded: paymentsSucceeded.length,
      failed: paymentsFailed.length,
      refunded: paymentsRefunded.length,
      failureRate: Number(failureRate.toFixed(2)),
      volumeGnf: totalVolumeGnf,
      avgAmount: paymentsSucceeded.length
        ? Math.round(totalVolumeGnf / paymentsSucceeded.length)
        : 0,
    },
    bookings: {
      thisWeek: bookingsCountThisWeek,
      avgDaysRegistrationToBooking: Number(avgDaysRegToBooking.toFixed(1)),
    },
    centres: centres.map((c) => ({
      id: c.id,
      nom: c.nom,
      ville: c.ville,
      region: c.region,
      capacite: c.capacite,
      totalBookings: c.bookings.length,
      fillRate: c.capacite
        ? Math.min(100, (c.bookings.length / (c.capacite * 7)) * 100)
        : 0,
    })),
    security: {
      fraudAlertsThisWeek,
      fraudBySeverity: fraudAlertsBySeverity.reduce(
        (acc, f) => ({ ...acc, [f.severity]: f._count }),
        {} as Record<string, number>,
      ),
      rateLimitEvents,
      geoblockEvents,
      ticketsOpen,
      ticketsThisWeek,
    },
    infrastructure: {
      // Optionally filled from Prometheus (see below)
      uptime7dPct: null as number | null,
      responseTimeP95Ms: null as number | null,
      responseTimeP99Ms: null as number | null,
      errors5xxPer1k: null as number | null,
    },
    alerts: [] as Array<{
      kpi: string
      value: number | string
      threshold: number | string
      level: 'info' | 'warning' | 'critical'
    }>,
  }

  // --- Thresholds check (alerts) ---
  if (report.exams.code.successRate > 0 && report.exams.code.successRate < 50) {
    report.alerts.push({
      kpi: 'Taux réussite code',
      value: Number(report.exams.code.successRate.toFixed(1)),
      threshold: 50,
      level: 'warning',
    })
  }
  if (report.payments.failureRate > 3) {
    report.alerts.push({
      kpi: 'Taux échec paiement',
      value: report.payments.failureRate,
      threshold: 3,
      level: 'warning',
    })
  }
  if (report.payments.failureRate > 5) {
    report.alerts.push({
      kpi: 'Taux échec paiement',
      value: report.payments.failureRate,
      threshold: 5,
      level: 'critical',
    })
  }
  if (report.acquisition.abandonRate > 20) {
    report.alerts.push({
      kpi: "Taux d'abandon",
      value: Number(report.acquisition.abandonRate.toFixed(1)),
      threshold: 20,
      level: 'warning',
    })
  }
  if (report.security.fraudAlertsThisWeek > 15) {
    report.alerts.push({
      kpi: 'Alertes fraude',
      value: report.security.fraudAlertsThisWeek,
      threshold: 15,
      level: 'critical',
    })
  }

  // --- Optional Prometheus queries ---
  const prometheusUrl = arg('prometheus') ?? process.env.PROMETHEUS_URL
  if (prometheusUrl) {
    try {
      console.log(`   Querying Prometheus at ${prometheusUrl}`)
      const queries = {
        uptime7dPct: 'avg_over_time(up{job="coderoute-app"}[7d]) * 100',
        responseTimeP95Ms:
          'histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[7d])) by (le)) * 1000',
        responseTimeP99Ms:
          'histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[7d])) by (le)) * 1000',
        errors5xxPer1k:
          '(sum(rate(http_requests_total{status=~"5.."}[7d])) / sum(rate(http_requests_total[7d]))) * 1000',
      }
      for (const [key, query] of Object.entries(queries)) {
        const url = `${prometheusUrl}/api/v1/query?query=${encodeURIComponent(query)}`
        const resp = await fetch(url)
        if (!resp.ok) {
          console.warn(`   ⚠️  Prometheus query ${key} failed: ${resp.status}`)
          continue
        }
        const data = (await resp.json()) as any
        const value = data?.data?.result?.[0]?.value?.[1]
        if (value != null) {
          ;(report.infrastructure as any)[key] = Number(value)
        }
      }
      if (
        report.infrastructure.uptime7dPct != null &&
        report.infrastructure.uptime7dPct < 99
      ) {
        report.alerts.push({
          kpi: 'Uptime 7j',
          value: Number(report.infrastructure.uptime7dPct.toFixed(2)),
          threshold: 99,
          level: 'critical',
        })
      }
      if (
        report.infrastructure.responseTimeP95Ms != null &&
        report.infrastructure.responseTimeP95Ms > 500
      ) {
        report.alerts.push({
          kpi: 'Temps réponse P95',
          value: Math.round(report.infrastructure.responseTimeP95Ms),
          threshold: 500,
          level: 'warning',
        })
      }
    } catch (err) {
      console.warn(`   ⚠️  Prometheus queries failed: ${(err as Error).message}`)
    }
  }

  return report
}

// ---------- Main ----------
async function main() {
  try {
    const report = await extractKPI()

    // Write to reports/pilot-kpi-S{N}-{YYYY-MM-DD}.json
    const reportsDir = join(process.cwd(), 'reports')
    mkdirSync(reportsDir, { recursive: true })
    const dateStr = weekStart.toISOString().slice(0, 10)
    const filename = `pilot-kpi-S${weekNum}-${dateStr}.json`
    const filepath = join(reportsDir, filename)
    writeFileSync(filepath, JSON.stringify(report, null, 2), 'utf8')

    console.log(`\n✅ KPI report generated: ${filepath}`)
    console.log(`   Alerts: ${report.alerts.length}`)
    if (report.alerts.length > 0) {
      console.log('   ---')
      for (const a of report.alerts) {
        const emoji = a.level === 'critical' ? '🔴' : a.level === 'warning' ? '🟡' : '🔵'
        console.log(`   ${emoji} [${a.level}] ${a.kpi}: ${a.value} (seuil ${a.threshold})`)
      }
    }

    // Quick console summary
    console.log('\n📋 Quick summary:')
    console.log(`   New candidats: ${report.acquisition.newUsersThisWeek}`)
    console.log(
      `   Code exams: ${report.exams.code.passed} (success ${report.exams.code.successRate.toFixed(1)}%)`,
    )
    console.log(
      `   Conduite exams: ${report.exams.conduite.passed} (success ${report.exams.conduite.successRate.toFixed(1)}%)`,
    )
    console.log(`   Payments: ${report.payments.total} (failure ${report.payments.failureRate}%)`)
    console.log(`   Volume: ${report.payments.volumeGnf} GNF`)
    console.log(`   Fraud alerts: ${report.security.fraudAlertsThisWeek}`)
    if (report.infrastructure.uptime7dPct != null) {
      console.log(`   Uptime 7j: ${report.infrastructure.uptime7dPct.toFixed(2)}%`)
    }

    await db.$disconnect()
    process.exit(0)
  } catch (err) {
    console.error('❌ KPI extraction failed:', err)
    await db.$disconnect()
    process.exit(1)
  }
}

main()
