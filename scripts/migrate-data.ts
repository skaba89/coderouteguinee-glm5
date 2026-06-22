// ============================================================
// CodeRoute Guinée — SQLite → PostgreSQL Data Migration
// ============================================================
// Streams all rows from the local SQLite DB into PostgreSQL
// with proper type conversion (String → enum, String → jsonb,
// role normalization `auto-ecole` → `auto_ecole`).
//
// Usage:
//   1. Start PostgreSQL:        docker compose -f docker-compose.postgres.yml up -d
//   2. Switch schema:           bash scripts/switch-db.sh postgres
//   3. Apply migrations:        npx prisma migrate deploy
//   4. Run this script:         npx tsx scripts/migrate-data.ts
//
// Environment:
//   PG_URL  — PostgreSQL connection string
//             (default: postgresql://coderoute:coderoute@localhost:5432/coderoute)
//   SQLITE_DB — Path to SQLite file (default: ./db/custom.db)
// ============================================================

import { PrismaClient } from '@prisma/client'
import Database from 'better-sqlite3'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// ─── Configuration ─────────────────────────────────────────
const PG_URL = process.env.PG_URL || 'postgresql://coderoute:coderoute@localhost:5432/coderoute'
const SQLITE_PATH = process.env.SQLITE_DB || resolve(process.cwd(), 'db/custom.db')

// ─── Role normalization (SQLite uses hyphens, PG enum uses underscores) ──
const ROLE_MAP: Record<string, string> = {
  'candidat': 'candidat',
  'auto-ecole': 'auto_ecole',
  'centre-agree': 'centre_agree',
  'administration': 'administration',
  'super-admin': 'super_admin',
}

const ACCRED_MAP: Record<string, string> = {
  'actif': 'actif',
  'en_renouvellement': 'en_renouvellement',
  'expire': 'expire',
  'suspendu': 'suspendu',
}

const QUESTION_CAT_MAP: Record<string, string> = {
  'Signalisation': 'Signalisation',
  'Priorités': 'Priorites',
  'Conduite': 'Conduite',
  'Sécurité': 'Securite',
  'Infractions': 'Infractions',
}

const DIFFICULTE_MAP: Record<string, string> = {
  'facile': 'facile',
  'moyen': 'moyen',
  'difficile': 'difficile',
}

const EXAM_STATUT_MAP: Record<string, string> = {
  'programme': 'programme',
  'en_cours': 'en_cours',
  'passe': 'passe',
  'reussi': 'reussi',
  'echoue': 'echoue',
  'annule': 'annule',
}

const PAYMENT_STATUT_MAP: Record<string, string> = {
  'en_attente': 'en_attente',
  'confirme': 'confirme',
  'echoue': 'echoue',
  'rembourse': 'rembourse',
}

const PAYMENT_MOYEN_MAP: Record<string, string> = {
  'mobile_money': 'mobile_money',
  'cash': 'cash',
  'carte': 'carte',
}

const FRAUD_SEVERITY_MAP: Record<string, string> = {
  'info': 'info',
  'low': 'low',
  'medium': 'medium',
  'high': 'high',
  'critical': 'critical',
}

const FRAUD_STATUS_MAP: Record<string, string> = {
  'active': 'active',
  'investigating': 'investigating',
  'resolved': 'resolved',
  'dismissed': 'dismissed',
}

const COURSE_STATUS_MAP: Record<string, string> = {
  'brouillon': 'brouillon',
  'publie': 'publie',
  'archive': 'archive',
}

const NOTIF_TYPE_MAP: Record<string, string> = {
  'email': 'email',
  'sms': 'sms',
}

const NOTIF_STATUS_MAP: Record<string, string> = {
  'pending': 'pending',
  'sent': 'sent',
  'failed': 'failed',
}

const AUDIT_SEVERITY_MAP: Record<string, string> = {
  'info': 'info',
  'warning': 'warning',
  'critical': 'critical',
}

// ─── Helpers ───────────────────────────────────────────────
function safeJsonParse(value: any, fallback: any) {
  if (value == null) return fallback
  if (typeof value !== 'string') return value
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

function safeDate(value: string | null): Date | null {
  if (!value) return null
  const d = new Date(value)
  return isNaN(d.getTime()) ? null : d
}

function mapEnum<T extends string>(value: any, map: Record<string, T>, fallback: T): T {
  if (value == null) return fallback
  return map[String(value)] ?? fallback
}

interface MigrationStats {
  table: string
  migrated: number
  failed: number
  errors: string[]
}

const stats: MigrationStats[] = []

function record(table: string, migrated: number, failed: number, errors: string[] = []) {
  stats.push({ table, migrated, failed, errors })
  const tag = failed === 0 ? '✓' : '⚠'
  console.log(`  ${tag} ${table}: ${migrated} migrated${failed > 0 ? `, ${failed} failed` : ''}`)
  if (errors.length > 0) {
    for (const e of errors.slice(0, 3)) console.log(`      → ${e}`)
  }
}

// ─── Main migration ────────────────────────────────────────
async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗')
  console.log('║  CodeRoute Guinée — SQLite → PostgreSQL Data Migration  ║')
  console.log('╚══════════════════════════════════════════════════════════╝')
  console.log(`  Source: SQLite  ${SQLITE_PATH}`)
  console.log(`  Target: PostgreSQL  ${PG_URL.replace(/:[^:@]+@/, ':****@')}`)
  console.log('')

  // Open SQLite
  const sqlite = new Database(SQLITE_PATH, { readonly: true })
  console.log('✓ SQLite opened')

  // Open PG via Prisma
  const pg = new PrismaClient({
    datasources: { db: { url: PG_URL } },
  })
  await pg.$connect()
  console.log('✓ PostgreSQL connected')
  console.log('')

  // ─── Users ───────────────────────────────────────────────
  console.log('→ Users...')
  {
    const rows = sqlite.prepare('SELECT * FROM User').all() as any[]
    let migrated = 0, failed = 0
    const errors: string[] = []
    for (const r of rows) {
      try {
        await pg.user.create({
          data: {
            id: r.id,
            email: r.email,
            passwordHash: r.passwordHash,
            nom: r.nom,
            prenom: r.prenom,
            dateNaissance: r.dateNaissance,
            numeroIdentite: r.numeroIdentite,
            telephone: r.telephone,
            ville: r.ville,
            region: r.region,
            categoriePermis: r.categoriePermis,
            role: mapEnum(r.role, ROLE_MAP, 'candidat'),
            numeroUnique: r.numeroUnique,
            langueMaternelle: r.langueMaternelle,
            photo: r.photo,
            actif: r.actif === 1 || r.actif === true,
            createdAt: safeDate(r.createdAt) ?? new Date(),
            updatedAt: safeDate(r.updatedAt) ?? new Date(),
          },
        })
        migrated++
      } catch (e: any) {
        failed++
        errors.push(`${r.email || r.id}: ${e.message}`)
      }
    }
    record('User', migrated, failed, errors)
  }

  // ─── Centres ─────────────────────────────────────────────
  console.log('→ Centres...')
  {
    const rows = sqlite.prepare('SELECT * FROM Centre').all() as any[]
    let migrated = 0, failed = 0
    const errors: string[] = []
    for (const r of rows) {
      try {
        await pg.centre.create({
          data: {
            id: r.id,
            nom: r.nom,
            ville: r.ville,
            region: r.region,
            adresse: r.adresse,
            capacite: r.capacite,
            telephone: r.telephone,
            email: r.email,
            actif: r.actif === 1 || r.actif === true,
            accredDateDebut: r.accredDateDebut,
            accredDateFin: r.accredDateFin,
            accredStatut: mapEnum(r.accredStatut, ACCRED_MAP, 'actif'),
            accredScore: r.accredScore,
            equipements: safeJsonParse(r.equipements, null),
            languesDisponibles: safeJsonParse(r.languesDisponibles, ['fr']),
            createdAt: safeDate(r.createdAt) ?? new Date(),
            updatedAt: safeDate(r.updatedAt) ?? new Date(),
          },
        })
        migrated++
      } catch (e: any) {
        failed++
        errors.push(`${r.nom || r.id}: ${e.message}`)
      }
    }
    record('Centre', migrated, failed, errors)
  }

  // ─── Questions ───────────────────────────────────────────
  console.log('→ Questions...')
  {
    const rows = sqlite.prepare('SELECT * FROM Question').all() as any[]
    let migrated = 0, failed = 0
    const errors: string[] = []
    for (const r of rows) {
      try {
        await pg.question.create({
          data: {
            id: r.id,
            texte: r.texte,
            options: safeJsonParse(r.options, []),
            bonneReponse: r.bonneReponse,
            categorie: mapEnum(r.categorie, QUESTION_CAT_MAP, 'Signalisation'),
            difficulte: mapEnum(r.difficulte, DIFFICULTE_MAP, 'facile'),
            mediaType: r.mediaType,
            signImage: r.signImage,
            scenarioImage: r.scenarioImage,
            videoUrl: r.videoUrl,
            audioFr: r.audioFr,
            explication: r.explication,
            points: r.points,
            tempsEstime: r.tempsEstime,
            tags: safeJsonParse(r.tags, []),
            actif: r.actif === 1 || r.actif === true,
            createdAt: safeDate(r.createdAt) ?? new Date(),
            updatedAt: safeDate(r.updatedAt) ?? new Date(),
          },
        })
        migrated++
      } catch (e: any) {
        failed++
        errors.push(`Q${r.id}: ${e.message}`)
      }
    }
    record('Question', migrated, failed, errors)
  }

  // ─── ExamSession ─────────────────────────────────────────
  console.log('→ ExamSessions...')
  {
    const rows = sqlite.prepare('SELECT * FROM ExamSession').all() as any[]
    let migrated = 0, failed = 0
    const errors: string[] = []
    for (const r of rows) {
      try {
        await pg.examSession.create({
          data: {
            id: r.id,
            candidatId: r.candidatId,
            centreId: r.centreId,
            centreNom: r.centreNom,
            date: r.date,
            heure: r.heure,
            langue: r.langue,
            statut: mapEnum(r.statut, EXAM_STATUT_MAP, 'programme'),
            score: r.score,
            totalQuestions: r.totalQuestions,
            dureeEffective: r.dureeEffective,
            dateInscription: safeDate(r.dateInscription) ?? new Date(),
            ipAdresse: r.ipAdresse,
            navigateur: r.navigateur,
            createdAt: safeDate(r.createdAt) ?? new Date(),
            updatedAt: safeDate(r.updatedAt) ?? new Date(),
          },
        })
        migrated++
      } catch (e: any) {
        failed++
        errors.push(`${r.id}: ${e.message}`)
      }
    }
    record('ExamSession', migrated, failed, errors)
  }

  // ─── Reponses ────────────────────────────────────────────
  console.log('→ Reponses...')
  {
    const rows = sqlite.prepare('SELECT * FROM Reponse').all() as any[]
    let migrated = 0, failed = 0
    const errors: string[] = []
    for (const r of rows) {
      try {
        await pg.reponse.create({
          data: {
            id: r.id,
            sessionId: r.sessionId,
            questionId: r.questionId,
            reponseDonnee: r.reponseDonnee,
            correcte: r.correcte === 1 || r.correcte === true,
            tempsReponse: r.tempsReponse,
            createdAt: safeDate(r.createdAt) ?? new Date(),
          },
        })
        migrated++
      } catch (e: any) {
        failed++
        errors.push(`${r.id}: ${e.message}`)
      }
    }
    record('Reponse', migrated, failed, errors)
  }

  // ─── Booking ─────────────────────────────────────────────
  console.log('→ Bookings...')
  {
    const rows = sqlite.prepare('SELECT * FROM Booking').all() as any[]
    let migrated = 0, failed = 0
    const errors: string[] = []
    for (const r of rows) {
      try {
        await pg.booking.create({
          data: {
            id: r.id,
            candidatId: r.candidatId,
            centreId: r.centreId,
            centreNom: r.centreNom,
            region: r.region,
            ville: r.ville,
            date: r.date,
            heure: r.heure,
            langue: r.langue,
            categoriePermis: r.categoriePermis,
            montant: r.montant,
            moyenPaiement: mapEnum(r.moyenPaiement, PAYMENT_MOYEN_MAP, 'mobile_money'),
            numeroPaiement: r.numeroPaiement,
            referencePaiement: r.referencePaiement,
            statutPaiement: mapEnum(r.statutPaiement, PAYMENT_STATUT_MAP, 'en_attente'),
            numeroConvocation: r.numeroConvocation,
            qrCodeData: r.qrCodeData,
            confirmee: r.confirmee === 1 || r.confirmee === true,
            createdAt: safeDate(r.createdAt) ?? new Date(),
            updatedAt: safeDate(r.updatedAt) ?? new Date(),
          },
        })
        migrated++
      } catch (e: any) {
        failed++
        errors.push(`${r.id}: ${e.message}`)
      }
    }
    record('Booking', migrated, failed, errors)
  }

  // ─── FraudAlert ──────────────────────────────────────────
  console.log('→ FraudAlerts...')
  {
    const rows = sqlite.prepare('SELECT * FROM FraudAlert').all() as any[]
    let migrated = 0, failed = 0
    const errors: string[] = []
    for (const r of rows) {
      try {
        await pg.fraudAlert.create({
          data: {
            id: r.id,
            type: r.type,
            description: r.description,
            severity: mapEnum(r.severity, FRAUD_SEVERITY_MAP, 'medium'),
            status: mapEnum(r.status, FRAUD_STATUS_MAP, 'active'),
            candidatId: r.candidatId,
            centreId: r.centreId,
            sessionId: r.sessionId,
            timestamp: safeDate(r.timestamp) ?? new Date(),
            details: safeJsonParse(r.details, null),
            resolvedAt: safeDate(r.resolvedAt),
            resolvedBy: r.resolvedBy,
            createdAt: safeDate(r.createdAt) ?? new Date(),
            updatedAt: safeDate(r.updatedAt) ?? new Date(),
          },
        })
        migrated++
      } catch (e: any) {
        failed++
        errors.push(`${r.id}: ${e.message}`)
      }
    }
    record('FraudAlert', migrated, failed, errors)
  }

  // ─── DailyStat ───────────────────────────────────────────
  console.log('→ DailyStats...')
  {
    const rows = sqlite.prepare('SELECT * FROM DailyStat').all() as any[]
    let migrated = 0, failed = 0
    const errors: string[] = []
    for (const r of rows) {
      try {
        await pg.dailyStat.create({
          data: {
            id: r.id,
            date: r.date,
            centreId: r.centreId,
            exams: r.exams,
            passed: r.passed,
            failed: r.failed,
            cancelled: r.cancelled,
            avgScore: r.avgScore,
            revenue: r.revenue,
            createdAt: safeDate(r.createdAt) ?? new Date(),
            updatedAt: safeDate(r.updatedAt) ?? new Date(),
          },
        })
        migrated++
      } catch (e: any) {
        failed++
        errors.push(`${r.date}: ${e.message}`)
      }
    }
    record('DailyStat', migrated, failed, errors)
  }

  // ─── Courses & Lessons ───────────────────────────────────
  console.log('→ Courses...')
  {
    const rows = sqlite.prepare('SELECT * FROM Course').all() as any[]
    let migrated = 0, failed = 0
    const errors: string[] = []
    for (const r of rows) {
      try {
        await pg.course.create({
          data: {
            id: r.id,
            titre: r.titre,
            description: r.description,
            categorie: r.categorie,
            status: mapEnum(r.status, COURSE_STATUS_MAP, 'publie'),
            imageCover: r.imageCover,
            dureeTotale: r.dureeTotale,
            nbInscrits: r.nbInscrits,
            rating: r.rating,
            createdAt: safeDate(r.createdAt) ?? new Date(),
            updatedAt: safeDate(r.updatedAt) ?? new Date(),
          },
        })
        migrated++
      } catch (e: any) {
        failed++
        errors.push(`${r.id}: ${e.message}`)
      }
    }
    record('Course', migrated, failed, errors)
  }

  console.log('→ Lessons...')
  {
    const rows = sqlite.prepare('SELECT * FROM Lesson').all() as any[]
    let migrated = 0, failed = 0
    const errors: string[] = []
    for (const r of rows) {
      try {
        await pg.lesson.create({
          data: {
            id: r.id,
            courseId: r.courseId,
            titre: r.titre,
            description: r.description,
            type: r.type,
            contenu: r.contenu,
            mediaUrl: r.mediaUrl,
            signImage: r.signImage,
            scenarioImage: r.scenarioImage,
            duree: r.duree,
            ordre: r.ordre,
            createdAt: safeDate(r.createdAt) ?? new Date(),
            updatedAt: safeDate(r.updatedAt) ?? new Date(),
          },
        })
        migrated++
      } catch (e: any) {
        failed++
        errors.push(`${r.id}: ${e.message}`)
      }
    }
    record('Lesson', migrated, failed, errors)
  }

  // ─── PasswordResetToken ──────────────────────────────────
  console.log('→ PasswordResetTokens...')
  {
    const rows = sqlite.prepare('SELECT * FROM PasswordResetToken').all() as any[]
    let migrated = 0, failed = 0
    const errors: string[] = []
    for (const r of rows) {
      try {
        await pg.passwordResetToken.create({
          data: {
            id: r.id,
            userId: r.userId,
            token: r.token,
            used: r.used === 1 || r.used === true,
            expiresAt: safeDate(r.expiresAt) ?? new Date(),
            createdAt: safeDate(r.createdAt) ?? new Date(),
          },
        })
        migrated++
      } catch (e: any) {
        failed++
        errors.push(`${r.id}: ${e.message}`)
      }
    }
    record('PasswordResetToken', migrated, failed, errors)
  }

  // ─── TwoFactorSecret ─────────────────────────────────────
  console.log('→ TwoFactorSecrets...')
  {
    const rows = sqlite.prepare('SELECT * FROM TwoFactorSecret').all() as any[]
    let migrated = 0, failed = 0
    const errors: string[] = []
    for (const r of rows) {
      try {
        await pg.twoFactorSecret.create({
          data: {
            id: r.id,
            userId: r.userId,
            secret: r.secret,
            backupCodes: safeJsonParse(r.backupCodes, []),
            enabled: r.enabled === 1 || r.enabled === true,
            verifiedAt: safeDate(r.verifiedAt),
            createdAt: safeDate(r.createdAt) ?? new Date(),
            updatedAt: safeDate(r.updatedAt) ?? new Date(),
          },
        })
        migrated++
      } catch (e: any) {
        failed++
        errors.push(`${r.id}: ${e.message}`)
      }
    }
    record('TwoFactorSecret', migrated, failed, errors)
  }

  // ─── NotificationLog ─────────────────────────────────────
  console.log('→ NotificationLogs...')
  {
    const rows = sqlite.prepare('SELECT * FROM NotificationLog').all() as any[]
    let migrated = 0, failed = 0
    const errors: string[] = []
    for (const r of rows) {
      try {
        await pg.notificationLog.create({
          data: {
            id: r.id,
            userId: r.userId,
            type: mapEnum(r.type, NOTIF_TYPE_MAP, 'email'),
            template: r.template,
            recipient: r.recipient,
            subject: r.subject,
            body: r.body,
            status: mapEnum(r.status, NOTIF_STATUS_MAP, 'pending'),
            provider: r.provider,
            error: r.error,
            sentAt: safeDate(r.sentAt),
            createdAt: safeDate(r.createdAt) ?? new Date(),
          },
        })
        migrated++
      } catch (e: any) {
        failed++
        errors.push(`${r.id}: ${e.message}`)
      }
    }
    record('NotificationLog', migrated, failed, errors)
  }

  // ─── AuditLog ────────────────────────────────────────────
  console.log('→ AuditLogs...')
  {
    const rows = sqlite.prepare('SELECT * FROM AuditLog').all() as any[]
    let migrated = 0, failed = 0
    const errors: string[] = []
    for (const r of rows) {
      try {
        await pg.auditLog.create({
          data: {
            id: r.id,
            eventType: r.eventType,
            severity: mapEnum(r.severity, AUDIT_SEVERITY_MAP, 'info'),
            userId: r.userId,
            userRole: r.userRole,
            targetId: r.targetId,
            targetType: r.targetType,
            description: r.description,
            details: safeJsonParse(r.details, null),
            ipAddress: r.ipAddress,
            userAgent: r.userAgent,
            timestamp: safeDate(r.timestamp) ?? new Date(),
          },
        })
        migrated++
      } catch (e: any) {
        failed++
        errors.push(`${r.id}: ${e.message}`)
      }
    }
    record('AuditLog', migrated, failed, errors)
  }

  // ─── TarifConfig ─────────────────────────────────────────
  console.log('→ TarifConfigs...')
  {
    const rows = sqlite.prepare('SELECT * FROM TarifConfig').all() as any[]
    let migrated = 0, failed = 0
    const errors: string[] = []
    for (const r of rows) {
      try {
        await pg.tarifConfig.create({
          data: {
            id: r.id,
            cle: r.cle,
            libelle: r.libelle,
            montant: r.montant,
            categoriePermis: r.categoriePermis,
            actif: r.actif === 1 || r.actif === true,
            note: r.note,
            modifiePar: r.modifiePar,
            createdAt: safeDate(r.createdAt) ?? new Date(),
            updatedAt: safeDate(r.updatedAt) ?? new Date(),
          },
        })
        migrated++
      } catch (e: any) {
        failed++
        errors.push(`${r.id}: ${e.message}`)
      }
    }
    record('TarifConfig', migrated, failed, errors)
  }

  // ─── Summary ─────────────────────────────────────────────
  console.log('')
  console.log('╔══════════════════════════════════════════════════════════╗')
  console.log('║  Migration Summary                                       ║')
  console.log('╚══════════════════════════════════════════════════════════╝')
  let totalMigrated = 0, totalFailed = 0
  for (const s of stats) {
    totalMigrated += s.migrated
    totalFailed += s.failed
    console.log(`  ${s.failed === 0 ? '✓' : '⚠'} ${s.table.padEnd(22)} ${String(s.migrated).padStart(6)} migrated  ${String(s.failed).padStart(4)} failed`)
  }
  console.log('  ' + '─'.repeat(56))
  console.log(`  ${'TOTAL'.padEnd(22)} ${String(totalMigrated).padStart(6)} migrated  ${String(totalFailed).padStart(4)} failed`)
  console.log('')

  if (totalFailed > 0) {
    console.log(`⚠  ${totalFailed} rows failed to migrate. See errors above.`)
    console.log('   Common causes:')
    console.log('   - Missing foreign key in target (check create order)')
    console.log('   - Invalid enum value (SQLite has unexpected string)')
    console.log('   - Date parsing error (check createdAt format)')
    await pg.$disconnect()
    sqlite.close()
    process.exit(1)
  }

  console.log('✓ All rows migrated successfully.')
  console.log('')
  console.log('Next steps:')
  console.log('  1. Restart the app with DATABASE_URL pointing to PostgreSQL')
  console.log('  2. Verify dashboard data at http://localhost:3000')
  console.log('  3. Backup: pg_dump $PG_URL > backups/coderoute-$(date +%Y%m%d).sql')

  await pg.$disconnect()
  sqlite.close()
}

main().catch((e) => {
  console.error('FATAL:', e)
  process.exit(1)
})
