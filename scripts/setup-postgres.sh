#!/bin/bash
# ============================================================
# CodeRoute Guinée — One-command PostgreSQL setup
# Starts a local PostgreSQL via Docker, applies migrations,
# migrates data from SQLite, and switches the active schema.
#
# Usage:
#   bash scripts/setup-postgres.sh            # full setup + data migration
#   bash scripts/setup-postgres.sh --fresh    # drop & recreate PG, re-seed
#   bash scripts/setup-postgres.sh --no-data  # apply schema only, skip data
# ============================================================

set -euo pipefail

cd "$(dirname "$0")/.."

PG_URL="${PG_URL:-postgresql://coderoute:coderoute@localhost:5432/coderoute}"
FRESH=0
MIGRATE_DATA=1

for arg in "$@"; do
  case "$arg" in
    --fresh)    FRESH=1 ;;
    --no-data)  MIGRATE_DATA=0 ;;
    *) echo "Unknown flag: $arg"; exit 1 ;;
  esac
done

echo "╔══════════════════════════════════════════════════════════╗"
echo "║  CodeRoute Guinée — PostgreSQL Setup                     ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "Target: ${PG_URL}"
echo ""

# ─── 1. Start PostgreSQL container ─────────────────────────
if ! command -v docker >/dev/null 2>&1; then
  echo "✗ Docker is not installed. Install Docker first:"
  echo "   https://docs.docker.com/get-docker/"
  exit 1
fi

echo "→ Starting PostgreSQL container..."
docker compose -f docker-compose.postgres.yml up -d

# Wait for healthy
echo "→ Waiting for PostgreSQL to be healthy..."
for i in $(seq 1 30); do
  STATUS=$(docker inspect --format='{{.State.Health.Status}}' coderoute-postgres 2>/dev/null || echo "")
  if [ "${STATUS}" = "healthy" ]; then
    echo "✓ PostgreSQL is healthy"
    break
  fi
  if [ "$i" = "30" ]; then
    echo "✗ PostgreSQL did not become healthy in 30s"
    docker logs coderoute-postgres | tail -30
    exit 1
  fi
  sleep 1
done

# ─── 2. Fresh mode: drop & recreate ────────────────────────
if [ "${FRESH}" = "1" ]; then
  echo "→ --fresh: dropping and recreating database..."
  docker exec coderoute-postgres psql -U coderoute -d postgres -c "DROP DATABASE IF EXISTS coderoute WITH (FORCE);" >/dev/null
  docker exec coderoute-postgres psql -U coderoute -d postgres -c "CREATE DATABASE coderoute;" >/dev/null
  docker exec coderoute-postgres psql -U coderoute -d coderoute -f /docker-entrypoint-initdb.d/01-init.sql 2>&1 | grep -v "^$" | head -5
fi

# ─── 3. Switch active schema to PostgreSQL ─────────────────
echo "→ Switching Prisma schema to PostgreSQL..."
bash scripts/switch-db.sh postgres

# ─── 4. Apply migrations ───────────────────────────────────
echo "→ Applying Prisma migrations..."
DATABASE_URL="${PG_URL}" npx prisma migrate deploy
echo "✓ Migrations applied"

# ─── 5. Migrate data from SQLite ───────────────────────────
if [ "${MIGRATE_DATA}" = "1" ]; then
  if [ ! -f "db/custom.db" ]; then
    echo "⚠  No SQLite database found at db/custom.db — skipping data migration"
    echo "   Run 'npm run db:seed' to populate PostgreSQL with seed data instead"
  else
    echo "→ Migrating data from SQLite..."
    PG_URL="${PG_URL}" npx tsx scripts/migrate-data.ts
  fi
else
  echo "→ --no-data: skipping data migration"
  echo "   Run 'npm run db:seed' to populate PostgreSQL with seed data"
fi

# ─── 6. Update .env ────────────────────────────────────────
echo "→ Updating .env to point to PostgreSQL..."
if grep -q "^DATABASE_URL=" .env; then
  sed -i.bak "s|^DATABASE_URL=.*|DATABASE_URL=${PG_URL}|" .env
  echo "✓ .env updated (backup at .env.bak)"
else
  echo "DATABASE_URL=${PG_URL}" >> .env
  echo "✓ .env created"
fi

# ─── 7. Generate Prisma Client ─────────────────────────────
echo "→ Generating Prisma Client..."
DATABASE_URL="${PG_URL}" npx prisma generate

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  ✓ PostgreSQL setup complete                             ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo "  1. Restart the dev server:  npm run dev"
echo "  2. Open http://localhost:3000 — your data is now in PostgreSQL"
echo "  3. Adminer UI at http://localhost:8080 (DB: coderoute, user: coderoute)"
echo ""
echo "To switch back to SQLite:"
echo "  bash scripts/switch-db.sh sqlite"
echo "  # then edit .env: DATABASE_URL=file:./db/custom.db"
