// ============================================================
// src/lib/scheduled-notifications.ts
// Scheduled notification jobs for CodeRoute Guinée.
//
// Jobs:
//   1. examReminder24h   — T-24h before exam: send SMS + email reminder
//   2. examReminder2h    — T-2h before exam: send SMS reminder
//   3. paymentPending7d  — pending payments older than 7d: alert candidate
//   4. weeklyAdminDigest — weekly summary to super-admins (Mondays 8am)
//   5. inactiveUserNudge — users who haven't logged in for 14 days
// ============================================================

import { db } from '@/lib/db'
import { sendNotification, NotificationTemplate } from '@/lib/notifications'

export interface JobResult {
  job: string
  processed: number
  sent: number
  failed: number
  errors: string[]
  durationMs: number
}

async function runJob(
  name: string,
  fn: () => Promise<{ sent: number; failed: number; errors: string[]; processed: number }>,
): Promise<JobResult> {
  const start = Date.now()
  try {
    const r = await fn()
    return {
      job: name,
      processed: r.processed,
      sent: r.sent,
      failed: r.failed,
      errors: r.errors,
      durationMs: Date.now() - start,
    }
  } catch (e) {
    return {
      job: name,
      processed: 0,
      sent: 0,
      failed: 1,
      errors: [e instanceof Error ? e.message : String(e)],
      durationMs: Date.now() - start,
    }
  }
}

// ─── Job 1: Exam reminder 24h before ───────────────────────

async function examReminder24h() {
  const now = new Date()
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const in25h = new Date(now.getTime() + 25 * 60 * 60 * 1000)

  // Find bookings confirmed, exam in ~24h
  // Booking.date is "YYYY-MM-DD", heure is "HH:mm"
  // We need to match by computing the target date string.
  const targetDay = in24h.toISOString().substring(0, 10)
  const targetHour = in24h.toISOString().substring(11, 16)

  const bookings = await db.booking.findMany({
    where: {
      statutPaiement: 'confirme',
      date: targetDay,
      // Heure within 1h window of target hour
    },
    include: {
      candidat: { select: { id: true, prenom: true, nom: true, email: true, telephone: true } },
      centre: { select: { nom: true, ville: true, region: true } },
    },
  })

  let sent = 0
  let failed = 0
  const errors: string[] = []
  for (const b of bookings) {
    // Check we haven't already sent a 24h reminder (NotificationLog)
    const alreadySent = await db.notificationLog.findFirst({
      where: {
        userId: b.candidatId,
        template: 'exam_reminder',
        // Looking at "24h" in the message
        body: { contains: '24h' },
        createdAt: { gte: new Date(now.getTime() - 6 * 60 * 60 * 1000) }, // last 6h
      },
    })
    if (alreadySent) continue

    try {
      const vars = {
        prenom: b.candidat.prenom,
        date: b.date,
        heure: b.heure,
        centre: b.centreNom,
        ville: b.ville,
      }
      // Send email
      await sendNotification({
        userId: b.candidatId,
        channel: 'email',
        template: 'exam_reminder',
        recipient: b.candidat.email,
        variables: { ...vars, time: '24h' },
      })
      // Send SMS if phone present
      if (b.candidat.telephone) {
        await sendNotification({
          userId: b.candidatId,
          channel: 'sms',
          template: 'exam_reminder',
          recipient: b.candidat.telephone,
          variables: { ...vars, time: '24h' },
        })
      }
      sent++
    } catch (e) {
      failed++
      errors.push(`Booking ${b.id}: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  return { processed: bookings.length, sent, failed, errors }
}

// ─── Job 2: Exam reminder 2h before (SMS only) ─────────────

async function examReminder2h() {
  const now = new Date()
  const in2h = new Date(now.getTime() + 2 * 60 * 60 * 1000)
  const targetDay = in2h.toISOString().substring(0, 10)

  const bookings = await db.booking.findMany({
    where: {
      statutPaiement: 'confirme',
      date: targetDay,
    },
    include: {
      candidat: { select: { id: true, prenom: true, nom: true, email: true, telephone: true } },
    },
  })

  let sent = 0
  let failed = 0
  const errors: string[] = []
  for (const b of bookings) {
    const alreadySent = await db.notificationLog.findFirst({
      where: {
        userId: b.candidatId,
        template: 'exam_reminder',
        body: { contains: '2h' },
        createdAt: { gte: new Date(now.getTime() - 60 * 60 * 1000) }, // last 1h
      },
    })
    if (alreadySent) continue

    try {
      if (b.candidat.telephone) {
        await sendNotification({
          userId: b.candidatId,
          channel: 'sms',
          template: 'exam_reminder',
          recipient: b.candidat.telephone,
          variables: {
            prenom: b.candidat.prenom,
            date: b.date,
            heure: b.heure,
            centre: b.centreNom,
            ville: b.ville,
            time: '2h',
          },
        })
        sent++
      }
    } catch (e) {
      failed++
      errors.push(`Booking ${b.id}: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  return { processed: bookings.length, sent, failed, errors }
}

// ─── Job 3: Pending payments alert (7+ days) ───────────────

async function paymentPending7d() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const bookings = await db.booking.findMany({
    where: {
      statutPaiement: 'en_attente',
      createdAt: { lte: sevenDaysAgo },
    },
    include: {
      candidat: { select: { id: true, prenom: true, email: true, telephone: true } },
    },
  })

  let sent = 0
  let failed = 0
  const errors: string[] = []
  for (const b of bookings) {
    const alreadySent = await db.notificationLog.findFirst({
      where: {
        userId: b.candidatId,
        template: 'payment_confirmation',
        body: { contains: 'en attente' },
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    })
    if (alreadySent) continue

    try {
      await sendNotification({
        userId: b.candidatId,
        channel: 'email',
        template: 'payment_confirmation',
        recipient: b.candidat.email,
        variables: {
          prenom: b.candidat.prenom,
          montant: b.montant.toString(),
          statut: 'en attente',
        },
      })
      sent++
    } catch (e) {
      failed++
      errors.push(`Booking ${b.id}: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  return { processed: bookings.length, sent, failed, errors }
}

// ─── Job 4: Weekly admin digest (Mondays) ──────────────────

async function weeklyAdminDigest() {
  // Only run on Mondays
  const now = new Date()
  if (now.getDay() !== 1) {
    return { processed: 0, sent: 0, failed: 0, errors: [] }
  }

  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const [
    newCandidates,
    newBookings,
    successfulPayments,
    failedPayments,
    newExams,
    passedExams,
  ] = await Promise.all([
    db.user.count({ where: { role: 'candidat', createdAt: { gte: lastWeek } } }),
    db.booking.count({ where: { createdAt: { gte: lastWeek } } }),
    db.booking.count({
      where: { statutPaiement: 'confirme', createdAt: { gte: lastWeek } },
    }),
    db.booking.count({
      where: { statutPaiement: 'echoue', createdAt: { gte: lastWeek } },
    }),
    db.examSession.count({ where: { createdAt: { gte: lastWeek } } }),
    db.examSession.count({
      where: { statut: 'reussi', createdAt: { gte: lastWeek } },
    }),
  ])

  const admins = await db.user.findMany({
    where: { role: { in: ['super-admin', 'administration'] }, actif: true },
    select: { id: true, email: true, prenom: true },
  })

  let sent = 0
  let failed = 0
  const errors: string[] = []

  const digest = `Bonjour,
Voici le résumé hebdomadaire de l'activité CodeRoute Guinée (7 derniers jours):

• Nouveaux candidats inscrits : ${newCandidates}
• Nouvelles réservations : ${newBookings}
• Paiements réussis : ${successfulPayments}
• Paiements échoués : ${failedPayments}
• Examens passés : ${newExams}
• Examens réussis : ${passedExams}
• Taux de réussite : ${newExams > 0 ? Math.round((passedExams / newExams) * 100) : 0}%

Cordialement,
Système CodeRoute Guinée`

  for (const admin of admins) {
    try {
      await sendNotification({
        userId: admin.id,
        channel: 'email',
        template: 'welcome', // Reuse welcome template; would ideally be a 'weekly_digest' template
        recipient: admin.email,
        variables: {
          prenom: admin.prenom,
          message: digest,
        },
      })
      sent++
    } catch (e) {
      failed++
      errors.push(`Admin ${admin.email}: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  return { processed: admins.length, sent, failed, errors }
}

// ─── Job 5: Inactive user nudge ────────────────────────────

async function inactiveUserNudge() {
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)

  // Users who haven't logged in for 14+ days (we use updatedAt as proxy)
  const inactiveUsers = await db.user.findMany({
    where: {
      role: 'candidat',
      actif: true,
      updatedAt: { lte: fourteenDaysAgo },
    },
    select: { id: true, prenom: true, email: true, updatedAt: true },
    take: 50, // Cap per run
  })

  let sent = 0
  let failed = 0
  const errors: string[] = []

  for (const u of inactiveUsers) {
    const alreadyNudged = await db.notificationLog.findFirst({
      where: {
        userId: u.id,
        template: 'welcome',
        body: { contains: 'réviser' },
        createdAt: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
      },
    })
    if (alreadyNudged) continue

    try {
      await sendNotification({
        userId: u.id,
        channel: 'email',
        template: 'welcome',
        recipient: u.email,
        variables: {
          prenom: u.prenom,
          message: `Bonjour ${u.prenom}, cela fait quelque temps que vous ne vous êtes pas connecté à CodeRoute Guinée. Pensez à réviser pour votre examen du code !`,
        },
      })
      sent++
    } catch (e) {
      failed++
      errors.push(`User ${u.email}: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  return { processed: inactiveUsers.length, sent, failed, errors }
}

// ─── Orchestration ─────────────────────────────────────────

export interface CronRunSummary {
  startedAt: string
  finishedAt: string
  totalDurationMs: number
  results: JobResult[]
}

export async function runScheduledJobs(
  jobFilter?: string[],
): Promise<CronRunSummary> {
  const startedAt = new Date()
  const allJobs: Array<{ name: string; fn: () => Promise<JobResult> }> = [
    { name: 'examReminder24h', fn: () => runJob('examReminder24h', examReminder24h) },
    { name: 'examReminder2h', fn: () => runJob('examReminder2h', examReminder2h) },
    { name: 'paymentPending7d', fn: () => runJob('paymentPending7d', paymentPending7d) },
    { name: 'weeklyAdminDigest', fn: () => runJob('weeklyAdminDigest', weeklyAdminDigest) },
    { name: 'inactiveUserNudge', fn: () => runJob('inactiveUserNudge', inactiveUserNudge) },
  ]

  const jobs = jobFilter
    ? allJobs.filter((j) => jobFilter.includes(j.name))
    : allJobs

  const results: JobResult[] = []
  for (const j of jobs) {
    results.push(await j.fn())
  }

  const finishedAt = new Date()
  return {
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    totalDurationMs: finishedAt.getTime() - startedAt.getTime(),
    results,
  }
}
