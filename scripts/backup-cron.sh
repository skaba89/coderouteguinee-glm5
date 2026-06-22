#!/bin/sh
# ============================================================
# CodeRoute Guinée — Database backup cron (runs in docker)
# ============================================================
# Runs pg_dump every day at 02:00, keeps the last N days.
# Mounted as /backup-cron.sh in the backup container.
#
# Required env (set in .env.production):
#   PGHOST, PGUSER, PGPASSWORD, PGDATABASE
#   BACKUP_RETENTION_DAYS (default 30)
# ============================================================

set -eu

RETENTION="${BACKUP_RETENTION_DAYS:-30}"
BACKUP_DIR="/backups"
TIMESTAMP=$(date -u +%Y%m%d-%H%M%S)
FILE="${BACKUP_DIR}/coderoute-${TIMESTAMP}.sql.gz"

echo "[$(date -u +%FT%TZ)] Starting backup → ${FILE}"

# Run pg_dump and compress on the fly
pg_dump --no-owner --no-privileges --clean --if-exists \
  | gzip -9 > "${FILE}"

# Verify the backup is non-empty
SIZE=$(stat -c %s "${FILE}" 2>/dev/null || stat -f %z "${FILE}")
if [ "${SIZE}" -lt 100 ]; then
  echo "[$(date -u +%FT%TZ)] ERROR: backup file is only ${SIZE} bytes — deleting"
  rm -f "${FILE}"
  exit 1
fi

echo "[$(date -u +%FT%TZ)] Backup OK (${SIZE} bytes)"

# Delete backups older than RETENTION days
echo "[$(date -u +%FT%TZ)] Pruning backups older than ${RETENTION} days"
find "${BACKUP_DIR}" -name "coderoute-*.sql.gz" -type f -mtime "+${RETENTION}" -delete

# Show what we have
echo "[$(date -u +%FT%TZ)] Current backups:"
ls -lh "${BACKUP_DIR}"/coderoute-*.sql.gz 2>/dev/null | tail -10

# ─── Run forever (sleep 24h between backups) ─────────────
echo "[$(date -u +%FT%TZ)] Next backup in 24h. Sleeping..."
exec sleep 86400
