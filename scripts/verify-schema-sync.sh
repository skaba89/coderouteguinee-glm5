#!/bin/bash
# ============================================================
# CodeRoute Guinée — Verify schema parity (SQLite ↔ PostgreSQL)
# Compares the model/field NAMES between schema.prisma (SQLite)
# and schema-postgres.prisma. Type-level differences (enums,
# jsonb, @db.Text, @db.Timestamptz) are intentional and allowed.
#
# Exit 0 if structurally identical, 1 if drift detected.
# ============================================================

set -euo pipefail
cd /home/z/my-project

SQLITE_SCHEMA="prisma/schema.prisma"
PG_SCHEMA="prisma/schema-postgres.prisma"

if [ ! -f "${SQLITE_SCHEMA}" ] || [ ! -f "${PG_SCHEMA}" ]; then
  echo "✗ Missing schema file(s)"
  exit 1
fi

# Extract model names + field names (ignore types and attributes).
# Format: "ModelName|fieldName" — one per line.
extract_structure() {
  awk '
    /^model / { in_model=1; model=$2; next }
    /^enum /  { in_model=0; next }
    in_model && /^\}/ { in_model=0; next }
    in_model && /^[ ]+[a-zA-Z]/ {
      # Strip comments and attributes
      line=$0
      sub(/\/\/.*/, "", line)
      sub(/ +\@\@.*$/, "", line)
      sub(/ +@.*$/, "", line)
      # First word is field name
      split(line, parts, /[ \t]+/)
      for (i=1; i<=length(parts); i++) {
        if (parts[i] != "") {
          print model "|" parts[i]
          break
        }
      }
    }
  ' "$1" | sort -u
}

SQLITE_STRUCT=$(extract_structure "${SQLITE_SCHEMA}")
PG_STRUCT=$(extract_structure "${PG_SCHEMA}")

DIFF=$(diff <(echo "${SQLITE_STRUCT}") <(echo "${PG_STRUCT}") || true)

if [ -z "${DIFF}" ]; then
  echo "✓ Schemas structurally aligned (SQLite ↔ PostgreSQL)"
  echo "  Models and fields match. Type-level differences are intentional."
  exit 0
else
  echo "⚠  Structural drift between SQLite and PostgreSQL schemas:"
  echo ""
  echo "${DIFF}" | head -30
  echo ""
  echo "Fix: ensure both schemas define the same models and fields."
  echo "Type-level differences (enums, jsonb, @db.*) are allowed."
  exit 1
fi
