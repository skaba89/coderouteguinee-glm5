#!/bin/bash
# ============================================================
# CodeRoute Guinée — Verify SQLite and PostgreSQL schemas match
# Compares the model definitions (excluding datasource/generator blocks)
# between schema.prisma (active SQLite) and schema-postgres.prisma.
#
# Exit 0 if identical, 1 if drift detected.
# ============================================================

set -euo pipefail

cd /home/z/my-project

SQLITE_SCHEMA="prisma/schema.prisma"
PG_SCHEMA="prisma/schema-postgres.prisma"

if [ ! -f "${SQLITE_SCHEMA}" ] || [ ! -f "${PG_SCHEMA}" ]; then
  echo "✗ Missing schema file(s)"
  exit 1
fi

# Extract everything after the datasource block (models, enums, etc.)
# Both schemas should define the same models in the same order.
extract_models() {
  # Print from the first "model " line to end of file
  awk '/^(model|enum) /{found=1} found' "$1"
}

DIFF=$(diff <(extract_models "${SQLITE_SCHEMA}") <(extract_models "${PG_SCHEMA}") || true)

if [ -z "${DIFF}" ]; then
  echo "✓ Schemas are in sync (SQLite ↔ PostgreSQL)"
  exit 0
else
  echo "✗ Schema drift detected between SQLite and PostgreSQL variants:"
  echo ""
  echo "${DIFF}" | head -50
  echo ""
  echo "Fix: apply the same model changes to both schema.prisma and schema-postgres.prisma"
  exit 1
fi
