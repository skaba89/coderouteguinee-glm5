#!/bin/bash
# ============================================================
# CodeRoute Guinée — Database Provider Switch
# Switches between SQLite (development) and PostgreSQL (production)
# Usage: bash scripts/switch-db.sh sqlite|postgres
# ============================================================

set -euo pipefail

DB_TYPE="${1:-sqlite}"
SCHEMA_FILE="prisma/schema.prisma"
SQLITE_SCHEMA="prisma/schema-sqlite.prisma"
POSTGRES_SCHEMA="prisma/schema-postgres.prisma"

# Ensure the SQLite schema file exists (mirror of schema.prisma)
if [ ! -f "${SQLITE_SCHEMA}" ]; then
  cp "${SCHEMA_FILE}" "${SQLITE_SCHEMA}"
  echo "Created SQLite schema mirror at ${SQLITE_SCHEMA}"
fi

case "${DB_TYPE}" in
  sqlite)
    echo "Switching to SQLite..."
    cp "${SQLITE_SCHEMA}" "${SCHEMA_FILE}"
    # Update .env to use SQLite if not already
    if grep -q "^DATABASE_URL=file:" .env 2>/dev/null; then
      echo "DATABASE_URL already points to SQLite."
    else
      echo "Note: Update DATABASE_URL in .env to: file:./db/custom.db"
    fi
    echo "Done. SQLite is now active."
    echo "Run: npx prisma generate && npx prisma db push"
    ;;

  postgres)
    echo "Switching to PostgreSQL..."
    cp "${POSTGRES_SCHEMA}" "${SCHEMA_FILE}"
    echo "Done. PostgreSQL is now active."
    echo "Update DATABASE_URL in .env to point to your PostgreSQL instance:"
    echo "  DATABASE_URL=postgresql://user:password@localhost:5432/coderoute?schema=public"
    echo "Then run: npx prisma generate && npx prisma migrate deploy"
    ;;

  *)
    echo "Usage: bash scripts/switch-db.sh sqlite|postgres"
    echo "  sqlite   — Use SQLite (development, file-based)"
    echo "  postgres — Use PostgreSQL (production, scalable)"
    exit 1
    ;;
esac
