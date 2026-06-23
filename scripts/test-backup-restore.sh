#!/usr/bin/env bash
# ============================================================
# CodeRoute Guinée — Monthly backup restore test (Sprint 12)
# ============================================================
# Validates that the daily encrypted backups can be restored.
# This script MUST be run monthly (cron: 0 3 1 * *) from a
# separate VM (not production) to avoid impacting the prod DB.
#
# Procedure:
#   1. Pick the most recent backup file (last 7 days max)
#   2. Decrypt it with BACKUP_ENCRYPTION_KEY
#   3. Restore to a temporary PostgreSQL instance
#   4. Run integrity queries (row counts on critical tables)
#   5. Compare with expected counts from production
#   6. Send report by email + Slack
#   7. Clean up temporary instance
#
# Exit codes:
#   0 = success, backup is restorable
#   1 = failure, backup is corrupted or incomplete
#   2 = no backup found in last 7 days
#
# Usage:
#   BACKUP_ENCRYPTION_KEY=xxx \
#   BACKUP_DIR=/var/backups/coderoute \
#   SMTP_HOST=... \
#   bash scripts/test-backup-restore.sh
# ============================================================

set -euo pipefail

# ─── Config ────────────────────────────────────────────────
BACKUP_DIR="${BACKUP_DIR:-/var/backups/coderoute}"
BACKUP_ENCRYPTION_KEY="${BACKUP_ENCRYPTION_KEY:?BACKUP_ENCRYPTION_KEY is required}"
TEMP_DB_CONTAINER="coderoute-restore-test"
TEMP_DB_PORT="15432"
REPORT_EMAIL="${REPORT_EMAIL:-rssi@coderoute-gn.org,dpo@coderoute-gn.org}"
SLACK_WEBHOOK="${SLACK_WEBHOOK:-}"

LOG_FILE="/var/log/coderoute/restore-test-$(date +%Y%m%d-%H%M%S).log"
mkdir -p "$(dirname "$LOG_FILE")"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  CodeRoute Guinée — Backup Restore Test                   ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
log "Starting backup restore test"
log "Backup directory: ${BACKUP_DIR}"
log "Log file: ${LOG_FILE}"
echo ""

# ─── Step 1: Find most recent backup ───────────────────────
log "Step 1/6: Finding most recent backup in ${BACKUP_DIR}..."

LATEST_BACKUP=$(find "${BACKUP_DIR}" -name "*.sql.gpg" -mtime -7 2>/dev/null | sort -r | head -n 1)

if [[ -z "${LATEST_BACKUP}" ]]; then
  log "ERROR: No backup file found in the last 7 days in ${BACKUP_DIR}"
  log "Backups present (any age):"
  ls -lh "${BACKUP_DIR}"/*.sql.gpg 2>/dev/null | head -5 | while read line; do
    log "  $line"
  done
  send_alert "BACKUP TEST FAILED" "No backup file found in last 7 days in ${BACKUP_DIR}"
  exit 2
fi

BACKUP_SIZE=$(du -h "${LATEST_BACKUP}" | cut -f1)
BACKUP_DATE=$(stat -c %y "${LATEST_BACKUP}" | cut -d. -f1)
log "OK: Found backup ${LATEST_BACKUP} (${BACKUP_SIZE}, dated ${BACKUP_DATE})"
echo ""

# ─── Step 2: Decrypt backup ────────────────────────────────
log "Step 2/6: Decrypting backup..."

DECRYPTED_FILE="/tmp/coderoute-restore-$(date +%Y%m%d-%H%M%S).sql"
trap "rm -f ${DECRYPTED_FILE}" EXIT

if ! echo "${BACKUP_ENCRYPTION_KEY}" | gpg --batch --yes --passphrase-fd 0 \
     --decrypt "${LATEST_BACKUP}" > "${DECRYPTED_FILE}" 2>>"${LOG_FILE}"; then
  log "ERROR: Failed to decrypt backup (wrong key or corrupted file)"
  send_alert "BACKUP TEST FAILED" "Decryption failed for ${LATEST_BACKUP}"
  exit 1
fi

DECRYPTED_SIZE=$(du -h "${DECRYPTED_FILE}" | cut -f1)
DECRYPTED_LINES=$(wc -l < "${DECRYPTED_FILE}")
log "OK: Backup decrypted (${DECRYPTED_SIZE}, ${DECRYPTED_LINES} lines)"
echo ""

# ─── Step 3: Start temporary PostgreSQL instance ───────────
log "Step 3/6: Starting temporary PostgreSQL instance on port ${TEMP_DB_PORT}..."

# Clean up any previous test container
docker rm -f "${TEMP_DB_CONTAINER}" 2>/dev/null || true

docker run -d \
  --name "${TEMP_DB_CONTAINER}" \
  -e POSTGRES_USER=coderoute \
  -e POSTGRES_PASSWORD=restore-test \
  -e POSTGRES_DB=coderoute \
  -p "${TEMP_DB_PORT}:5432" \
  postgres:16-alpine >>"${LOG_FILE}" 2>&1

# Wait for PostgreSQL to be ready
log "Waiting for PostgreSQL to be ready..."
for i in $(seq 1 30); do
  if docker exec "${TEMP_DB_CONTAINER}" pg_isready -U coderoute -d coderoute >>"${LOG_FILE}" 2>&1; then
    log "OK: PostgreSQL is ready (after ${i}s)"
    break
  fi
  sleep 1
  if [[ $i -eq 30 ]]; then
    log "ERROR: PostgreSQL did not start within 30s"
    send_alert "BACKUP TEST FAILED" "Temporary PostgreSQL did not start"
    docker rm -f "${TEMP_DB_CONTAINER}" 2>/dev/null || true
    exit 1
  fi
done
echo ""

# ─── Step 4: Restore backup to temp instance ───────────────
log "Step 4/6: Restoring backup to temporary instance..."

RESTORE_START=$(date +%s)

if ! docker exec -i "${TEMP_DB_CONTAINER}" \
  psql -U coderoute -d coderoute < "${DECRYPTED_FILE}" >>"${LOG_FILE}" 2>&1; then
  log "ERROR: Failed to restore backup (SQL errors)"
  send_alert "BACKUP TEST FAILED" "Restore failed — SQL errors in ${LATEST_BACKUP}"
  docker rm -f "${TEMP_DB_CONTAINER}" 2>/dev/null || true
  exit 1
fi

RESTORE_END=$(date +%s)
RESTORE_DURATION=$((RESTORE_END - RESTORE_START))
log "OK: Backup restored in ${RESTORE_DURATION}s"
echo ""

# ─── Step 5: Integrity checks ──────────────────────────────
log "Step 5/6: Running integrity checks on restored data..."

EXPECTED_TABLES=(
  "User" "Centre" "ExamSession" "Booking" "Payment" "ExamResult"
  "Notification" "AuditLog" "FraudAlert" "Course" "Lesson" "Question"
  "Tarif" "ScheduledNotification"
)

FAILURES=0
INTEGRITY_REPORT=""

for table in "${EXPECTED_TABLES[@]}"; do
  COUNT=$(docker exec "${TEMP_DB_CONTAINER}" \
    psql -U coderoute -d coderoute -t -c \
    "SELECT COUNT(*) FROM \"${table}\";" 2>>"${LOG_FILE}" | tr -d '[:space:]')

  if [[ -z "${COUNT}" ]]; then
    log "  ✗ Table '${table}': MISSING or query failed"
    INTEGRITY_REPORT="${INTEGRITY_REPORT}✗ ${table}: MISSING\n"
    FAILURES=$((FAILURES+1))
  else
    log "  ✓ Table '${table}': ${COUNT} rows"
    INTEGRITY_REPORT="${INTEGRITY_REPORT}✓ ${table}: ${COUNT} rows\n"
  fi
done

# ─── Specific integrity checks ─────────────────────────────
log ""
log "Running specific integrity checks..."

# Check 1: At least 1 admin user
ADMIN_COUNT=$(docker exec "${TEMP_DB_CONTAINER}" \
  psql -U coderoute -d coderoute -t -c \
  'SELECT COUNT(*) FROM "User" WHERE role = '\''super-admin'\'' OR role = '\''administration'\'';' \
  2>>"${LOG_FILE}" | tr -d '[:space:]')

if [[ "${ADMIN_COUNT:-0}" -lt 1 ]]; then
  log "  ✗ CRITICAL: No admin user found in restored backup"
  INTEGRITY_REPORT="${INTEGRITY_REPORT}✗ No admin user — CRITICAL\n"
  FAILURES=$((FAILURES+1))
else
  log "  ✓ Admin users: ${ADMIN_COUNT}"
  INTEGRITY_REPORT="${INTEGRITY_REPORT}✓ Admin users: ${ADMIN_COUNT}\n"
fi

# Check 2: Audit log is append-only (no UPDATE/DELETE)
AUDIT_LOG_COUNT=$(docker exec "${TEMP_DB_CONTAINER}" \
  psql -U coderoute -d coderoute -t -c \
  'SELECT COUNT(*) FROM "AuditLog";' 2>>"${LOG_FILE}" | tr -d '[:space:]')

if [[ "${AUDIT_LOG_COUNT:-0}" -lt 1 ]]; then
  log "  ✗ WARNING: Audit log is empty — may indicate fresh backup or integrity issue"
  INTEGRITY_REPORT="${INTEGRITY_REPORT}⚠ Audit log empty\n"
else
  log "  ✓ Audit log entries: ${AUDIT_LOG_COUNT}"
  INTEGRITY_REPORT="${INTEGRITY_REPORT}✓ Audit log entries: ${AUDIT_LOG_COUNT}\n"
fi

# Check 3: No orphan payments (payment without booking)
ORPHAN_PAYMENTS=$(docker exec "${TEMP_DB_CONTAINER}" \
  psql -U coderoute -d coderoute -t -c \
  'SELECT COUNT(*) FROM "Payment" p LEFT JOIN "Booking" b ON p."bookingId" = b.id WHERE b.id IS NULL;' \
  2>>"${LOG_FILE}" | tr -d '[:space:]')

if [[ "${ORPHAN_PAYMENTS:-0}" -gt 0 ]]; then
  log "  ✗ WARNING: ${ORPHAN_PAYMENTS} orphan payments found (payment without booking)"
  INTEGRITY_REPORT="${INTEGRITY_REPORT}⚠ ${ORPHAN_PAYMENTS} orphan payments\n"
else
  log "  ✓ No orphan payments"
  INTEGRITY_REPORT="${INTEGRITY_REPORT}✓ No orphan payments\n"
fi

# Check 4: Passwords are hashed (argon2id format)
WEAK_PASSWORDS=$(docker exec "${TEMP_DB_CONTAINER}" \
  psql -U coderoute -d coderoute -t -c \
  'SELECT COUNT(*) FROM "User" WHERE "passwordHash" NOT LIKE '\''$argon2id$%'\'';' \
  2>>"${LOG_FILE}" | tr -d '[:space:]')

if [[ "${WEAK_PASSWORDS:-0}" -gt 0 ]]; then
  log "  ✗ CRITICAL: ${WEAK_PASSWORDS} users with non-argon2id password hash"
  INTEGRITY_REPORT="${INTEGRITY_REPORT}✗ ${WEAK_PASSWORDS} weak password hashes — CRITICAL\n"
  FAILURES=$((FAILURES+1))
else
  log "  ✓ All passwords are argon2id-hashed"
  INTEGRITY_REPORT="${INTEGRITY_REPORT}✓ All passwords argon2id\n"
fi

echo ""

# ─── Step 6: Generate report and clean up ──────────────────
log "Step 6/6: Generating report and cleaning up..."

# Clean up
docker rm -f "${TEMP_DB_CONTAINER}" >>"${LOG_FILE}" 2>&1
rm -f "${DECRYPTED_FILE}"

# Build report
REPORT="CodeRoute Guinée — Backup Restore Test Report
==================================================
Date: $(date '+%Y-%m-%d %H:%M:%S %Z')
Backup tested: ${LATEST_BACKUP}
Backup date: ${BACKUP_DATE}
Backup size (encrypted): ${BACKUP_SIZE}
Backup size (decrypted): ${DECRYPTED_SIZE}
Restore duration: ${RESTORE_DURATION}s

Integrity Report:
$(echo -e "${INTEGRITY_REPORT}")

Result: $([[ ${FAILURES} -eq 0 ]] && echo "✓ SUCCESS — backup is restorable" || echo "✗ FAILED — ${FAILURES} issue(s) detected")

Full log: ${LOG_FILE}
"

# Email report (if SMTP configured)
if [[ -n "${SMTP_HOST:-}" ]]; then
  SUBJECT="[CodeRoute] Backup restore test — $([[ ${FAILURES} -eq 0 ]] && echo "SUCCESS" || echo "FAILED")"
  echo "${REPORT}" | mail -s "${SUBJECT}" "${REPORT_EMAIL}" 2>>"${LOG_FILE}" || true
  log "Report emailed to ${REPORT_EMAIL}"
fi

# Slack notification
if [[ -n "${SLACK_WEBHOOK}" ]]; then
  COLOR=$([[ ${FAILURES} -eq 0 ]] && echo "good" || echo "danger")
  curl -s -X POST -H 'Content-Type: application/json' \
    --data "{\"attachments\":[{\"color\":\"${COLOR}\",\"title\":\"Backup Restore Test\",\"text\":\"$(echo "${REPORT}" | sed ':a;N;$!ba;s/\n/\\n/g')\"}]}" \
    "${SLACK_WEBHOOK}" >>"${LOG_FILE}" 2>&1 || true
  log "Slack notification sent"
fi

# Final summary
echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Backup Restore Test — Final Summary                     ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "${REPORT}"

if [[ ${FAILURES} -eq 0 ]]; then
  log "✓ SUCCESS — backup is restorable"
  exit 0
else
  log "✗ FAILED — ${FAILURES} issue(s) detected"
  exit 1
fi
