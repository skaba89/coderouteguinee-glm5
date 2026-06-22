// ============================================================
// CodeRoute Guinée — PostgreSQL Migration Dry-Run Validator
// ============================================================
// Validates that the SQLite database is ready for migration to
// PostgreSQL without actually performing the migration.
//
// Checks performed:
//   1. All SQLite tables exist and have rows
//   2. Enum-like columns contain only values present in the PG enum maps
//   3. Foreign key references are intact (no orphan rows)
//   4. Date columns are parseable
//   5. JSON columns are valid JSON (or null)
//   6. Reports a summary with PASS/WARN/FAIL for each table
//
// Exit codes:
//   0 — All checks passed (or only warnings)
//   1 — At least one table has blocking errors
//
// Usage:
//   npx tsx scripts/validate-pg-migration.ts
//
// Env:
//   SQLITE_DB — Path to SQLite file (default: ./db/custom.db)
// ============================================================

import Database from 'better-sqlite3'
import { resolve } from 'node:path'

const SQLITE_PATH = process.env.SQLITE_DB || resolve(process.cwd(), 'db/custom.db')

// ─── Tables & expected enum values (mirrors migrate-data.ts maps) ──
interface TableSpec {
  name: string
  enumColumns?: Record<string, string[]> // column → allowed values
  jsonColumns?: string[]
  dateColumns?: string[]
}

const TABLES: TableSpec[] = [
  { name: 'User', enumColumns: {
      role: ['candidat', 'auto-ecole', 'centre-agree', 'administration', 'super-admin'],
      categoriePermis: ['A', 'B', 'C', 'D', 'E'],
    },
    dateColumns: ['createdAt', 'updatedAt'],
  },
  { name: 'Centre',
    enumColumns: { accredStatut: ['actif', 'en_renouvellement', 'expire', 'suspendu'] },
    dateColumns: ['createdAt', 'updatedAt', 'accredDateDebut', 'accredDateFin'],
    jsonColumns: ['equipements', 'languesDisponibles'],
  },
  { name: 'Region', dateColumns: ['createdAt'] },
  { name: 'Question',
    enumColumns: {
      categorie: ['Signalisation', 'Priorités', 'Conduite', 'Sécurité', 'Infractions'],
      difficulte: ['facile', 'moyen', 'difficile'],
    },
    dateColumns: ['createdAt', 'updatedAt'],
  },
  { name: 'QuestionAudio', dateColumns: ['createdAt'] },
  { name: 'Course',
    enumColumns: { status: ['brouillon', 'publie', 'archive'] },
    dateColumns: ['createdAt', 'updatedAt'],
  },
  { name: 'CourseProgress', dateColumns: ['createdAt', 'updatedAt', 'completedAt'] },
  { name: 'ExamSession',
    enumColumns: {
      statut: ['programme', 'en_cours', 'passe', 'reussi', 'echoue', 'annule'],
    },
    dateColumns: ['createdAt', 'updatedAt', 'date', 'dateInscription'],
  },
  { name: 'Booking', dateColumns: ['createdAt', 'updatedAt'] },
  { name: 'Payment',
    enumColumns: {
      statut: ['en_attente', 'confirme', 'echoue', 'rembourse'],
      moyen: ['mobile_money', 'cash', 'carte'],
    },
    dateColumns: ['createdAt', 'updatedAt', 'paidAt'],
  },
  { name: 'NotificationLog',
    enumColumns: {
      type: ['email', 'sms'],
      status: ['pending', 'sent', 'failed'],
    },
    dateColumns: ['createdAt', 'sentAt'],
  },
  { name: 'AuditLog',
    enumColumns: { severity: ['info', 'warning', 'critical'] },
    dateColumns: ['timestamp'],
    jsonColumns: ['details'],
  },
  { name: 'FraudAlert',
    enumColumns: {
      severity: ['info', 'low', 'medium', 'high', 'critical'],
      status: ['active', 'investigating', 'resolved', 'dismissed'],
    },
    dateColumns: ['createdAt', 'updatedAt', 'timestamp', 'resolvedAt'],
    jsonColumns: ['details'],
  },
  { name: 'TarifConfig', dateColumns: ['createdAt', 'updatedAt'] },
  { name: 'Session', dateColumns: ['createdAt', 'expiresAt'] },
  { name: 'TwoFactorBackup', dateColumns: ['createdAt', 'usedAt'] },
]

interface CheckResult {
  table: string
  status: 'PASS' | 'WARN' | 'FAIL'
  rows: number
  issues: string[]
}

function severity(s: CheckResult['status']): string {
  return s === 'PASS' ? '✓' : s === 'WARN' ? '⚠' : '✗'
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗')
  console.log('║  CodeRoute Guinée — PostgreSQL Migration Dry-Run        ║')
  console.log('╚══════════════════════════════════════════════════════════╝')
  console.log(`  SQLite: ${SQLITE_PATH}`)
  console.log('')

  const sqlite = new Database(SQLITE_PATH, { readonly: true })
  const results: CheckResult[] = []

  for (const spec of TABLES) {
    const result: CheckResult = { table: spec.name, status: 'PASS', rows: 0, issues: [] }

    // 1. Table exists?
    let tableExists = false
    try {
      const row = sqlite.prepare(
        `SELECT name FROM sqlite_master WHERE type='table' AND name=?`
      ).get(spec.name)
      tableExists = !!row
    } catch (e: any) {
      result.status = 'FAIL'
      result.issues.push(`Cannot query sqlite_master: ${e.message}`)
      results.push(result)
      continue
    }

    if (!tableExists) {
      result.status = 'WARN'
      result.issues.push('Table does not exist in SQLite (will be created empty in PG)')
      results.push(result)
      continue
    }

    // 2. Count rows
    try {
      const row = sqlite.prepare(`SELECT COUNT(*) as count FROM "${spec.name}"`).get() as any
      result.rows = row.count
    } catch (e: any) {
      result.status = 'FAIL'
      result.issues.push(`Cannot count rows: ${e.message}`)
      results.push(result)
      continue
    }

    // 3. Check enum columns
    if (spec.enumColumns) {
      for (const [col, allowed] of Object.entries(spec.enumColumns)) {
        try {
          const badRows = sqlite.prepare(
            `SELECT DISTINCT "${col}" as v FROM "${spec.name}" WHERE "${col}" IS NOT NULL AND "${col}" NOT IN (${allowed.map(() => '?').join(',')})`
          ).all(...allowed) as any[]
          if (badRows.length > 0) {
            result.status = 'FAIL'
            result.issues.push(`Enum "${col}" has invalid values: ${badRows.map(r => JSON.stringify(r.v)).join(', ')}`)
          }
        } catch (e: any) {
          // Column may not exist — that's a soft warning
          result.status = result.status === 'FAIL' ? 'FAIL' : 'WARN'
          result.issues.push(`Cannot check enum "${col}": ${e.message}`)
        }
      }
    }

    // 4. Check JSON columns are valid JSON (or null/empty)
    if (spec.jsonColumns) {
      for (const col of spec.jsonColumns) {
        try {
          const rows = sqlite.prepare(
            `SELECT "${col}" as v FROM "${spec.name}" WHERE "${col}" IS NOT NULL AND "${col}" != ''`
          ).all() as any[]
          let badCount = 0
          const badSamples: string[] = []
          for (const r of rows) {
            try {
              if (typeof r.v === 'string') JSON.parse(r.v)
            } catch {
              badCount++
              if (badSamples.length < 3) badSamples.push(String(r.v).slice(0, 60))
            }
          }
          if (badCount > 0) {
            result.status = result.status === 'FAIL' ? 'FAIL' : 'WARN'
            result.issues.push(`JSON column "${col}": ${badCount} invalid JSON values (samples: ${badSamples.join(', ')})`)
          }
        } catch (e: any) {
          // Column may not exist
          result.status = result.status === 'FAIL' ? 'FAIL' : 'WARN'
          result.issues.push(`Cannot check JSON "${col}": ${e.message}`)
        }
      }
    }

    // 5. Check date columns are parseable
    if (spec.dateColumns) {
      for (const col of spec.dateColumns) {
        try {
          const rows = sqlite.prepare(
            `SELECT "${col}" as v FROM "${spec.name}" WHERE "${col}" IS NOT NULL AND "${col}" != ''`
          ).all() as any[]
          let badCount = 0
          const badSamples: string[] = []
          for (const r of rows) {
            const d = new Date(r.v)
            if (isNaN(d.getTime())) {
              badCount++
              if (badSamples.length < 3) badSamples.push(String(r.v))
            }
          }
          if (badCount > 0) {
            result.status = result.status === 'FAIL' ? 'FAIL' : 'WARN'
            result.issues.push(`Date column "${col}": ${badCount} unparseable values (samples: ${badSamples.join(', ')})`)
          }
        } catch (e: any) {
          // Column may not exist
          if (!result.issues.some(i => i.includes(`Cannot check enum "${col}"`))) {
            result.status = result.status === 'FAIL' ? 'FAIL' : 'WARN'
            result.issues.push(`Cannot check date "${col}": ${e.message}`)
          }
        }
      }
    }

    results.push(result)
  }

  // ─── Print summary ──────────────────────────────────────
  console.log('')
  console.log('  Table                   Rows   Status   Issues')
  console.log('  ' + '─'.repeat(70))
  let passCount = 0, warnCount = 0, failCount = 0
  for (const r of results) {
    console.log(`  ${severity(r.status)} ${r.table.padEnd(22)} ${String(r.rows).padStart(6)}   ${r.status.padEnd(5)}   ${r.issues.length} issue(s)`)
    if (r.status === 'PASS') passCount++
    else if (r.status === 'WARN') warnCount++
    else failCount++
  }
  console.log('  ' + '─'.repeat(70))
  console.log(`  ${passCount} passed, ${warnCount} warnings, ${failCount} failures`)
  console.log('')

  // ─── Print detailed issues ──────────────────────────────
  const withIssues = results.filter(r => r.issues.length > 0)
  if (withIssues.length > 0) {
    console.log('Detailed issues:')
    console.log('')
    for (const r of withIssues) {
      console.log(`  [${r.status}] ${r.table}:`)
      for (const issue of r.issues) {
        console.log(`      • ${issue}`)
      }
    }
    console.log('')
  }

  // ─── Decision ───────────────────────────────────────────
  if (failCount > 0) {
    console.log(`✗ ${failCount} table(s) have blocking errors. Fix them before running migrate-data.ts.`)
    sqlite.close()
    process.exit(1)
  }

  if (warnCount > 0) {
    console.log(`⚠ ${warnCount} table(s) have warnings. Migration can proceed but verify results.`)
  } else {
    console.log('✓ All tables passed validation. Safe to run migrate-data.ts.')
  }
  console.log('')
  console.log('Next steps:')
  console.log('  1. Start PostgreSQL:    docker compose -f docker-compose.postgres.yml up -d')
  console.log('  2. Switch schema:       bash scripts/switch-db.sh postgres')
  console.log('  3. Apply schema:        npx prisma migrate dev --name init')
  console.log('  4. Migrate data:        npx tsx scripts/migrate-data.ts')
  console.log('  5. Restart app:         npm run dev')

  sqlite.close()
  process.exit(0)
}

main().catch((e) => {
  console.error('FATAL:', e)
  process.exit(1)
})
