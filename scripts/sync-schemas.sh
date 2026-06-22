#!/bin/bash
# ============================================================
# CodeRoute Guinée — Manual schema sync (NOT auto-run)
# ============================================================
# The PostgreSQL schema (schema-postgres.prisma) is hand-maintained
# with native PG optimizations (enums, jsonb, citext, @db.Text).
# It is NOT auto-synced from schema.prisma because the two schemas
# intentionally diverge at the type level.
#
# When you add a new model/field to schema.prisma (SQLite), you MUST
# also add it to schema-postgres.prisma with the appropriate PG type.
# Run verify-schema-sync.sh to check that the structure is in parity.
#
# This script is a convenience: it shows the structural diff and
# reminds you to manually update the PG schema.
# ============================================================

set -euo pipefail
cd /home/z/my-project

echo "╔══════════════════════════════════════════════════════════╗"
echo "║  Schema Sync Reminder                                    ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "The PostgreSQL schema (prisma/schema-postgres.prisma) is"
echo "hand-maintained with native PG types. It is NOT auto-synced."
echo ""
echo "If you added a new model or field to schema.prisma (SQLite),"
echo "you MUST also add it to schema-postgres.prisma."
echo ""
echo "Running structural verification..."
echo ""
bash scripts/verify-schema-sync.sh
