#!/bin/bash
# ============================================================
# CodeRoute Guinée — Migrate SQLite → PostgreSQL
# Streams all data from the local SQLite DB into PostgreSQL.
#
# Prerequisites:
#   1. PostgreSQL container running: docker compose -f docker-compose.postgres.yml up -d
#   2. Schema switched: bash scripts/switch-db.sh postgres
#   3. Schema applied: npx prisma migrate dev --name init (or prisma db push)
#
# Usage: bash scripts/migrate-sqlite-to-postgres.sh
# ============================================================

set -euo pipefail

SQLITE_DB="/home/z/my-project/db/custom.db"
PG_URL="${PG_URL:-postgresql://coderoute:coderoute@localhost:5432/coderoute}"

if [ ! -f "${SQLITE_DB}" ]; then
  echo "✗ SQLite database not found at ${SQLITE_DB}"
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "✗ psql not installed. Install PostgreSQL client:"
  echo "  sudo apt-get install -y postgresql-client"
  exit 1
fi

echo "╔══════════════════════════════════════════════════════════╗"
echo "║  CodeRoute Guinée — SQLite → PostgreSQL Migration       ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "Source:  SQLite  ${SQLITE_DB}"
echo "Target:  PostgreSQL  ${PG_URL}"
echo ""

# 1. Check connectivity
if ! psql "${PG_URL}" -c "SELECT version();" >/dev/null 2>&1; then
  echo "✗ Cannot connect to PostgreSQL. Verify the container is up:"
  echo "  docker compose -f docker-compose.postgres.yml up -d"
  exit 1
fi
echo "✓ PostgreSQL reachable"

# 2. List tables in SQLite
TABLES=$(sqlite3 "${SQLITE_DB}" ".tables" | tr -s ' ' '\n' | grep -v '^$' | sort)
echo ""
echo "SQLite tables to migrate:"
echo "${TABLES}" | sed 's/^/  - /'
echo ""

# 3. For each table, export to CSV and import via COPY
#    (Prisma creates tables with same names; we trust the schema is applied)
migrate_table() {
  local table="$1"
  local tmp_csv="/tmp/cr_${table}.csv"
  echo "→ Migrating ${table}..."

  # Export from SQLite (header row + CSV)
  sqlite3 -header -csv "${SQLITE_DB}" "SELECT * FROM \"${table}\";" > "${tmp_csv}"

  local row_count
  row_count=$(wc -l < "${tmp_csv}")
  row_count=$((row_count - 1))  # subtract header
  if [ "${row_count}" -lt 0 ]; then row_count=0; fi

  if [ "${row_count}" -eq 0 ]; then
    echo "  (empty table, skipping)"
    rm -f "${tmp_csv}"
    return 0
  fi

  # Truncate target (cascade to drop dependent rows first)
  psql "${PG_URL}" -c "TRUNCATE TABLE \"${table}\" RESTART IDENTITY CASCADE;" >/dev/null 2>&1 || true

  # Import via \copy (client-side, works without superuser)
  psql "${PG_URL}" -c "\copy \"${table}\" FROM '${tmp_csv}' WITH (FORMAT csv, HEADER true)" >/dev/null 2>&1 \
    && echo "  ✓ ${row_count} rows imported" \
    || echo "  ✗ Failed to import (table may not exist in PG schema yet)"

  rm -f "${tmp_csv}"
}

for t in ${TABLES}; do
  # Skip Prisma internal migration table
  [ "${t}" = "_prisma_migrations" ] && continue
  migrate_table "${t}"
done

echo ""
echo "✓ Migration complete."
echo ""
echo "Next steps:"
echo "  1. Verify counts: psql \"${PG_URL}\" -c '\\dt'"
echo "  2. Restart app: bash scripts/switch-db.sh postgres && npm run dev"
echo "  3. Update .env: DATABASE_URL=${PG_URL}"
