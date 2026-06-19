#!/bin/bash
# ============================================================
# CodeRoute Guinée — Database Backup Script
# Creates timestamped backups of the SQLite database
# Usage: bash scripts/backup-db.sh
# ============================================================

set -euo pipefail

DB_PATH="${DB_PATH:-db/custom.db}"
BACKUP_DIR="${BACKUP_DIR:-backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/coderoute_backup_${TIMESTAMP}.db"

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

# Check if database file exists
if [ ! -f "${DB_PATH}" ]; then
  echo "ERROR: Database file not found at ${DB_PATH}"
  exit 1
fi

# Create backup using SQLite's built-in backup (safe for live DB)
# Fallback to file copy if sqlite3 CLI is not installed (dev environments)
echo "Backing up database from ${DB_PATH}..."
if command -v sqlite3 >/dev/null 2>&1; then
  sqlite3 "${DB_PATH}" ".backup '${BACKUP_FILE}'"
  BACKUP_RC=$?
else
  echo "WARNING: sqlite3 CLI not found — using file copy fallback (safe for dev, may capture in-flight writes)."
  cp "${DB_PATH}" "${BACKUP_FILE}"
  BACKUP_RC=$?
fi

if [ ${BACKUP_RC} -eq 0 ]; then
  FILESIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
  echo "Backup created: ${BACKUP_FILE} (${FILESIZE})"
  
  # Compress the backup
  gzip "${BACKUP_FILE}"
  echo "Compressed: ${BACKUP_FILE}.gz"
  
  # Clean up old backups (keep last 30)
  echo "Cleaning up old backups (keeping last 30)..."
  ls -t "${BACKUP_DIR}"/coderoute_backup_*.db.gz 2>/dev/null | tail -n +31 | xargs -r rm
  echo "Backup complete."
else
  echo "ERROR: Backup failed!"
  rm -f "${BACKUP_FILE}"
  exit 1
fi
