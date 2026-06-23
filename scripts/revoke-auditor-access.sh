#!/usr/bin/env bash
# ============================================================
# CodeRoute Guinée — Revoke Auditor Access (Sprint 11)
# ============================================================
# Revokes all temporary access granted to an external auditor
# at the end of the security audit mission (cf. docs/audit-externe/05-ACCES-TEMPORAIRES.md).
#
# This script MUST be run:
#   - At the end of the audit mission (J+45)
#   - In case of premature termination (breach of charter)
#   - In case of force majeure (real security incident during audit)
#
# Usage:
#   bash scripts/revoke-auditor-access.sh
#
# Prerequisites:
#   - SSH access to all 5 servers (app-prod-1/2, db-prod-1/2, redis-prod-1)
#   - PostgreSQL superuser credentials
#   - Redis admin credentials
#   - GitHub admin token (env: GITHUB_TOKEN)
#   - The auditor's GitHub username (env: AUDITOR_GH_USER, default: auditeur-coderoute-2026)
# ============================================================

set -euo pipefail

# ─── Config ─────────────────────────────────────────────────
AUDITOR_GH_USER="${AUDITOR_GH_USER:-auditeur-coderoute-2026}"
AUDITOR_UNIX_USER="${AUDITOR_UNIX_USER:-auditeur}"
AUDITOR_PG_USER="${AUDITOR_PG_USER:-auditeur_ro}"
AUDITOR_REDIS_USER="${AUDITOR_REDIS_USER:-auditeur}"

SERVERS=(
  "app-prod-1.conakry-dc.gn"
  "app-prod-2.conakry-dc.gn"
  "db-prod-1.conakry-dc.gn"
  "db-prod-2.kankan-dc.gn"
  "redis-prod-1.conakry-dc.gn"
)

LOG_FILE="docs/audit-externe/audit-2026-revocation-$(date +%Y%m%d-%H%M%S).log"
mkdir -p "$(dirname "$LOG_FILE")"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  CodeRoute Guinée — Revoke Auditor Access                ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Log file: ${YELLOW}${LOG_FILE}${NC}"
echo ""

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

FAILURES=0

# ─── 1. Revoke GitHub access ────────────────────────────────
log "Step 1/6: Revoking GitHub access for ${AUDITOR_GH_USER}..."

if [[ -z "${GITHUB_TOKEN:-}" ]]; then
  log "WARN: GITHUB_TOKEN not set — skipping GitHub revocation (manual step required)"
  log "  → Remove user '${AUDITOR_GH_USER}' from collaborator list of skaba89/coderouteguinee-glm5"
else
  if curl -sS -X DELETE \
    -H "Authorization: token ${GITHUB_TOKEN}" \
    -H "Accept: application/vnd.github+json" \
    "https://api.github.com/repos/skaba89/coderouteguinee-glm5/collaborators/${AUDITOR_GH_USER}" \
    2>&1 | tee -a "$LOG_FILE"; then
    log "OK: GitHub collaborator removed"
  else
    log "ERROR: Failed to remove GitHub collaborator"
    FAILURES=$((FAILURES+1))
  fi
fi
echo ""

# ─── 2. Revoke SSH access on all servers ────────────────────
log "Step 2/6: Revoking SSH access on ${#SERVERS[@]} servers..."

for server in "${SERVERS[@]}"; do
  log "  → ${server}"
  if ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=accept-new \
    "root@${server}" \
    "sed -i.bak '/${AUDITOR_UNIX_USER}/d' /home/${AUDITOR_UNIX_USER}/.ssh/authorized_keys 2>/dev/null; \
     userdel -r ${AUDITOR_UNIX_USER} 2>/dev/null || true; \
     echo 'Revocation done on ${server}'" 2>&1 | tee -a "$LOG_FILE"; then
    log "  OK: ${server}"
  else
    log "  ERROR: Failed to revoke on ${server}"
    FAILURES=$((FAILURES+1))
  fi
done
echo ""

# ─── 3. Revoke PostgreSQL access ────────────────────────────
log "Step 3/6: Revoking PostgreSQL user ${AUDITOR_PG_USER}..."

PG_COMMANDS="
-- Disable the role (prevent new logins)
ALTER ROLE ${AUDITOR_PG_USER} NOLOGIN;
-- Revoke all privileges
REVOKE SELECT ON ALL TABLES IN SCHEMA public FROM ${AUDITOR_PG_USER};
REVOKE USAGE ON SCHEMA public FROM ${AUDITOR_PG_USER};
REVOKE CONNECT ON DATABASE coderoute FROM ${AUDITOR_PG_USER};
-- Drop the role (only if no dependencies)
DROP ROLE IF EXISTS ${AUDITOR_PG_USER};
"

if ssh -o ConnectTimeout=10 root@db-prod-1.conakry-dc.gn \
  "sudo -u postgres psql -d coderoute -c \"${PG_COMMANDS}\"" 2>&1 | tee -a "$LOG_FILE"; then
  log "OK: PostgreSQL role revoked on Conakry"
else
  log "ERROR: Failed to revoke PostgreSQL role on Conakry"
  FAILURES=$((FAILURES+1))
fi

# Also on Kankan replica
if ssh -o ConnectTimeout=10 root@db-prod-2.kankan-dc.gn \
  "sudo -u postgres psql -d coderoute -c \"${PG_COMMANDS}\"" 2>&1 | tee -a "$LOG_FILE"; then
  log "OK: PostgreSQL role revoked on Kankan"
else
  log "ERROR: Failed to revoke PostgreSQL role on Kankan"
  FAILURES=$((FAILURES+1))
fi
echo ""

# ─── 4. Revoke Redis access ─────────────────────────────────
log "Step 4/6: Revoking Redis user ${AUDITOR_REDIS_USER}..."

if ssh -o ConnectTimeout=10 root@redis-prod-1.conakry-dc.gn \
  "redis-cli -a \"\${REDIS_PASSWORD}\" ACL DELUSER ${AUDITOR_REDIS_USER}" 2>&1 | tee -a "$LOG_FILE"; then
  log "OK: Redis user removed"
else
  log "ERROR: Failed to remove Redis user"
  FAILURES=$((FAILURES+1))
fi
echo ""

# ─── 5. Disable application staging accounts ────────────────
log "Step 5/6: Disabling auditor staging application accounts..."

if ssh -o ConnectTimeout=10 root@app-prod-1.conakry-dc.gn \
  "cd /opt/coderoute && \
   sudo -u coderote DATABASE_URL=\"\${DATABASE_URL}\" \
   npx prisma db execute --stdin <<'SQL'
UPDATE \"User\" SET \"deletedAt\" = NOW(), \"isActive\" = false
WHERE email LIKE 'auditeur-%@staging.coderoute-gn.org';
SQL" 2>&1 | tee -a "$LOG_FILE"; then
  log "OK: Staging accounts disabled"
else
  log "ERROR: Failed to disable staging accounts"
  FAILURES=$((FAILURES+1))
fi
echo ""

# ─── 6. Generate audit log report ───────────────────────────
log "Step 6/6: Generating audit log report of auditor actions..."

AUDIT_LOG_REPORT="docs/audit-externe/audit-2026-actions.log"
if ssh -o ConnectTimeout=10 root@app-prod-1.conakry-dc.gn \
  "cd /opt/coderoute && \
   sudo -u coderote DATABASE_URL=\"\${DATABASE_URL}\" \
   npx prisma db execute --stdin <<'SQL'
COPY (
  SELECT \"timestamp\", \"actor\", \"action\", \"target\", \"ipAddress\", \"userAgent\", \"metadata\"
  FROM \"AuditLog\"
  WHERE \"actor\" LIKE 'auditeur%'
  ORDER BY \"timestamp\" ASC
) TO STDOUT WITH CSV HEADER;
SQL" > "${AUDIT_LOG_REPORT}" 2>&1; then
  log "OK: Audit log report saved to ${AUDIT_LOG_REPORT}"
  ACTION_COUNT=$(wc -l < "${AUDIT_LOG_REPORT}")
  log "  Total auditor actions logged: $((ACTION_COUNT - 1))"
else
  log "ERROR: Failed to generate audit log report"
  FAILURES=$((FAILURES+1))
fi
echo ""

# ─── Summary ────────────────────────────────────────────────
log ""
log "═══════════════════════════════════════════════════════"
if [[ $FAILURES -eq 0 ]]; then
  log "✓ ALL REVOCATIONS COMPLETED SUCCESSFULLY"
  log ""
  log "Checklist (verify manually):"
  log "  [ ] GitHub collaborator removed"
  log "  [ ] SSH keys removed on 5 servers"
  log "  [ ] PostgreSQL user dropped on Conakry + Kankan"
  log "  [ ] Redis user deleted"
  log "  [ ] 5 staging application accounts disabled"
  log "  [ ] Audit log report generated"
  log "  [ ] NDA archived in vault"
  log "  [ ] Closing minutes signed by DNTT + RSSI + auditor"
  log ""
  log "Audit log of all auditor actions: ${AUDIT_LOG_REPORT}"
  exit 0
else
  log "✗ ${FAILURES} revocation(s) failed — manual intervention required"
  log ""
  log "Failed steps are listed above. Investigate and re-run failed steps manually."
  log "After manual remediation, re-run this script to verify completeness."
  exit 1
fi
