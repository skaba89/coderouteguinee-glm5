#!/bin/bash
# ============================================================
# CodeRoute Guinée — PostgreSQL Migration Orchestrator
# ============================================================
# One-command pipeline:
#   1. Validate SQLite data (dry-run, no side effects)
#   2. Switch Prisma schema to PostgreSQL
#   3. Apply PG schema (prisma migrate deploy)
#   4. Migrate data from SQLite to PG
#   5. Restart the dev server with the new DATABASE_URL
#
# Usage:
#   bash scripts/pg-migrate-all.sh              # full pipeline
#   bash scripts/pg-migrate-all.sh --validate   # step 1 only
#   bash scripts/pg-migrate-all.sh --skip-data  # steps 1-3, skip 4
#
# Env:
#   PG_URL — PostgreSQL connection string
#            (default: postgresql://coderoute:coderoute@localhost:5432/coderoute)
# ============================================================

set -euo pipefail

cd "$(dirname "$0")/.."

PG_URL="${PG_URL:-postgresql://coderoute:coderoute@localhost:5432/coderoute}"
VALIDATE_ONLY=0
SKIP_DATA=0

for arg in "$@"; do
  case "$arg" in
    --validate)  VALIDATE_ONLY=1 ;;
    --skip-data) SKIP_DATA=1 ;;
    *) echo "Unknown flag: $arg"; exit 1 ;;
  esac
done

echo "╔══════════════════════════════════════════════════════════╗"
echo "║  CodeRoute Guinée — PG Migration Orchestrator            ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "Target: ${PG_URL}"
echo ""

# ─── Step 1: Validate ────────────────────────────────────
echo "─── Step 1/5: Validate SQLite data ────────────────────────"
if npx tsx scripts/validate-pg-migration.ts; then
  echo "✓ Validation passed"
else
  echo "✗ Validation failed — aborting migration"
  exit 1
fi

if [ "${VALIDATE_ONLY}" = "1" ]; then
  echo ""
  echo "✓ --validate mode: stopping after validation."
  exit 0
fi

# ─── Step 2: Switch schema ───────────────────────────────
echo ""
echo "─── Step 2/5: Switch Prisma schema to PostgreSQL ──────────"
bash scripts/switch-db.sh postgres

# Backup current .env
cp .env ".env.backup-$(date +%Y%m%d-%H%M%S)"

# Update DATABASE_URL in .env
if grep -q "^DATABASE_URL=" .env; then
  sed -i "s|^DATABASE_URL=.*|DATABASE_URL=\"${PG_URL}\"|" .env
else
  echo "DATABASE_URL=\"${PG_URL}\"" >> .env
fi
echo "✓ .env updated with PG URL (backup saved)"

# ─── Step 3: Generate client + apply schema ──────────────
echo ""
echo "─── Step 3/5: Generate Prisma client + apply schema ───────"
npx prisma generate

if [ "${SKIP_DATA}" = "1" ]; then
  # Use db push instead of migrate (no migration files needed)
  npx prisma db push
  echo "✓ Schema pushed (no data migration)"
  echo ""
  echo "Done. Restart with: npm run dev"
  exit 0
fi

# Full migration with migrations folder
npx prisma migrate deploy || npx prisma db push
echo "✓ Schema applied"

# ─── Step 4: Migrate data ────────────────────────────────
echo ""
echo "─── Step 4/5: Migrate data SQLite → PostgreSQL ────────────"
npx tsx scripts/migrate-data.ts
echo "✓ Data migrated"

# ─── Step 5: Verify ──────────────────────────────────────
echo ""
echo "─── Step 5/5: Verify row counts ────────────────────────────"
npx tsx -e "
import { PrismaClient } from '@prisma/client'
const pg = new PrismaClient({ datasources: { db: { url: '${PG_URL}' } } })
const tables = ['User', 'Centre', 'Question', 'ExamSession', 'Booking', 'NotificationLog', 'AuditLog']
console.log('  Table             Rows')
console.log('  ' + '-'.repeat(35))
for (const t of tables) {
  try {
    const count = await pg[t].count()
    console.log('  ' + t.padEnd(18) + String(count).padStart(6))
  } catch (e) {
    console.log('  ' + t.padEnd(18) + '  ERR')
  }
}
await pg.\$disconnect()
"

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  ✓ Migration complete                                     ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "Next:"
echo "  1. Restart dev server:   npm run dev"
echo "  2. Verify dashboard:     http://localhost:3000"
echo "  3. Rollback if needed:   bash scripts/switch-db.sh sqlite"
echo "                            (and restore .env from backup)"
