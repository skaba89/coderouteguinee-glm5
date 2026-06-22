#!/bin/bash
# ============================================================
# CodeRoute Guinée — Sync SQLite schema → PostgreSQL schema
# Copies the model/enum definitions from schema.prisma (SQLite)
# into schema-postgres.prisma, preserving the PG-specific header
# (provider = "postgresql", env("DATABASE_URL")).
#
# Usage: bash scripts/sync-schemas.sh
# ============================================================

set -euo pipefail

cd /home/z/my-project

SQLITE_SCHEMA="prisma/schema.prisma"
PG_SCHEMA="prisma/schema-postgres.prisma"

if [ ! -f "${SQLITE_SCHEMA}" ]; then
  echo "✗ ${SQLITE_SCHEMA} not found"
  exit 1
fi

# Build the new PG schema:
# 1. Header (PG datasource + provider)
# 2. Everything from the first "model " or "enum " line in the SQLite schema
{
  cat << 'HEADER'
// ============================================================
// CodeRoute Guinée — Database Schema (PostgreSQL variant)
// Auto-synced from schema.prisma via scripts/sync-schemas.sh
// To activate: bash scripts/switch-db.sh postgres
// ============================================================

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

HEADER
  awk '/^(model|enum) /{found=1} found' "${SQLITE_SCHEMA}"
} > "${PG_SCHEMA}.tmp"

mv "${PG_SCHEMA}.tmp" "${PG_SCHEMA}"
echo "✓ Synced models from ${SQLITE_SCHEMA} → ${PG_SCHEMA}"

# Re-run verification
bash scripts/verify-schema-sync.sh
