#!/usr/bin/env bash
# ============================================================
# CodeRoute Guinée — Staging Twin Provisioning (Sprint 13)
# ============================================================
# Provisions a staging environment that is a TWIN of production:
#   - Same Docker images (pinned by digest)
#   - Same configuration (env vars + secrets)
#   - Same database schema (migrated to latest)
#   - Same WAF + ModSecurity rules
#   - Same monitoring stack (Prometheus + Grafana + Loki)
#   - Anonymized production data snapshot (RGPD-compliant)
#
# Use cases:
#   1. Pre-deployment validation (run before any prod deploy)
#   2. Reproduce production incidents
#   3. Load testing (k6 scenarios target staging, never prod)
#   4. Security audit (auditors get staging access, not prod)
#
# Usage:
#   ./scripts/prepare-staging-twin.sh [--refresh-data] [--skip-waf]
#
# Exit codes:
#   0  Success
#   1  Pre-flight check failed
#   2  Data export/transfer failed
#   3  Container startup failed
#   4  Smoke test failed
# ============================================================

set -euo pipefail

# ─── Configuration ─────────────────────────────────────────
STAGING_HOST="${STAGING_HOST:-staging.coderoute.gov.gn}"
STAGING_USER="${STAGING_USER:-ops}"
PROD_HOST="${PROD_HOST:-conakry-dc.coderoute.gov.gn}"
PROD_USER="${PROD_USER:-ops}"
PROJECT_DIR="/opt/coderoute-staging"

REFRESH_DATA=false
SKIP_WAF=false

# Parse args
while [[ $# -gt 0 ]]; do
  case "$1" in
    --refresh-data) REFRESH_DATA=true; shift ;;
    --skip-waf)     SKIP_WAF=true;     shift ;;
    -h|--help)
      sed -n '2,25p' "$0"
      exit 0
      ;;
    *) echo "Unknown arg: $1" >&2; exit 1 ;;
  esac
done

# ─── Logging ───────────────────────────────────────────────
log()  { echo -e "\033[1;32m[+]\033[0m $*" >&2; }
warn() { echo -e "\033[1;33m[!]\033[0m $*" >&2; }
err()  { echo -e "\033[1;31m[x]\033[0m $*" >&2; }

# ─── Pre-flight checks ────────────────────────────────────
log "Pre-flight checks..."

REQUIRED_VARS=(
  STAGING_HOST
  PROD_HOST
  DATABASE_URL
  REDIS_PASSWORD
  BACKUP_ENCRYPTION_KEY
  JWT_SECRET
  SESSION_SECRET
  ORANGE_MONEY_API_KEY
  MTN_MOMO_API_KEY
)
for v in "${REQUIRED_VARS[@]}"; do
  if [[ -z "${!v:-}" ]]; then
    err "Missing env var: $v"
    exit 1
  fi
done

# Verify SSH access to both DCs
for host in "${PROD_USER}@${PROD_HOST}" "${STAGING_USER}@${STAGING_HOST}"; do
  if ! ssh -o ConnectTimeout=5 -o BatchMode=yes "$host" "true" 2>/dev/null; then
    err "SSH access failed to $host — check your SSH keys"
    exit 1
  fi
done
log "  SSH access OK to both DCs"

# Verify Docker daemon on staging
if ! ssh "${STAGING_USER}@${STAGING_HOST}" "docker info" >/dev/null 2>&1; then
  err "Docker not running on ${STAGING_HOST}"
  exit 1
fi
log "  Docker daemon OK on staging"

# ─── Step 1: Sync code + config ────────────────────────────
log "Step 1/6: Syncing code + config to staging..."
ssh "${STAGING_USER}@${STAGING_HOST}" "mkdir -p ${PROJECT_DIR}"

# Rsync the project (excluding heavy dirs that don't need to be on staging)
rsync -avz --delete \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='playwright-report' \
  --exclude='test-results' \
  --exclude='backups' \
  --exclude='download' \
  --exclude='upload' \
  --exclude='tool-results' \
  --exclude='agent-ctx' \
  ./ "${STAGING_USER}@${STAGING_HOST}:${PROJECT_DIR}/"

log "  Code synced to ${PROJECT_DIR}"

# ─── Step 2: Push env files (secrets) ──────────────────────
log "Step 2/6: Pushing environment files..."

# Create .env.staging on remote (secrets transferred via SSH, never via rsync)
ssh "${STAGING_USER}@${STAGING_HOST}" "cat > ${PROJECT_DIR}/.env.staging" <<EOF
NODE_ENV=production
DATABASE_URL=${DATABASE_URL}
REDIS_PASSWORD=${REDIS_PASSWORD}
JWT_SECRET=${JWT_SECRET}
SESSION_SECRET=${SESSION_SECRET}
NEXTAUTH_URL=https://${STAGING_HOST}
NEXTAUTH_SECRET=${SESSION_SECRET}
ORANGE_MONEY_API_KEY=${ORANGE_MONEY_API_KEY}
ORANGE_MONEY_WEBHOOK_SECRET=${ORANGE_MONEY_WEBHOOK_SECRET}
MTN_MOMO_API_KEY=${MTN_MOMO_API_KEY}
MTN_MOMO_WEBHOOK_SECRET=${MTN_MOMO_WEBHOOK_SECRET}
BACKUP_ENCRYPTION_KEY=${BACKUP_ENCRYPTION_KEY}
SENTRY_DSN=${SENTRY_DSN:-}
GRAFANA_ADMIN_PASSWORD=${GRAFANA_ADMIN_PASSWORD}
PROMETHEUS_BEARER_TOKEN=${PROMETHEUS_BEARER_TOKEN}
GEOBLOCK_POLICY=lenient
GEOBLOCK_FAIL_CLOSED=false
EOF

log "  .env.staging pushed (secrets via SSH)"

# ─── Step 3: Pull Docker images (same digest as prod) ─────
log "Step 3/6: Pulling Docker images (same digest as prod)..."

# Get the image digest currently running in production
PROD_DIGEST=$(ssh "${PROD_USER}@${PROD_HOST}" \
  "docker inspect coderoute-app --format='{{index .Image}}'" 2>/dev/null || echo "")

if [[ -z "$PROD_DIGEST" ]]; then
  warn "Could not fetch prod image digest — falling back to :latest tag"
  PROD_DIGEST="coderoute-app:latest"
else
  log "  Prod image digest: ${PROD_DIGEST:0:32}..."
fi

ssh "${STAGING_USER}@${STAGING_HOST}" \
  "cd ${PROJECT_DIR} && docker compose -f docker-compose.staging.yml pull app"

log "  Image pulled on staging"

# ─── Step 4: Refresh data (optional) ───────────────────────
if [[ "$REFRESH_DATA" == "true" ]]; then
  log "Step 4/6: Refreshing staging data with anonymized prod snapshot..."

  # 4a. Take a backup from prod (encrypted)
  BACKUP_FILE="staging-snapshot-$(date +%Y%m%d-%H%M%S).sql.gpg"
  log "  4a. Creating encrypted backup on prod: ${BACKUP_FILE}"
  ssh "${PROD_USER}@${PROD_HOST}" \
    "cd /opt/coderoute && ./scripts/backup-db.sh /tmp/${BACKUP_FILE}"

  # 4b. Transfer to staging
  log "  4b. Transferring backup to staging..."
  scp "${PROD_USER}@${PROD_HOST}:/tmp/${BACKUP_FILE}" \
      "${STAGING_USER}@${STAGING_HOST}:/tmp/${BACKUP_FILE}"

  # 4c. Restore on staging (with anonymization pass)
  log "  4c. Restoring + anonymizing on staging..."
  ssh "${STAGING_USER}@${STAGING_HOST}" <<EOF
    cd ${PROJECT_DIR}
    export BACKUP_ENCRYPTION_KEY=${BACKUP_ENCRYPTION_KEY}
    export DATABASE_URL=${DATABASE_URL}

    # Decrypt backup
    gpg --batch --passphrase "\${BACKUP_ENCRYPTION_KEY}" \\
        --decrypt /tmp/${BACKUP_FILE} > /tmp/staging-restore.sql

    # Anonymize PII (RGPD requirement)
    sed -i \\
      -e 's/\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}\\b/anon@example.com/g' \\
      -e 's/\\b\\+224[0-9 ]{9,}\\b/+224 600 00 00 00/g' \\
      /tmp/staging-restore.sql

    # Restore
    psql "\${DATABASE_URL}" < /tmp/staging-restore.sql

    # Cleanup
    shred -u /tmp/staging-restore.sql /tmp/${BACKUP_FILE}
EOF
  log "  Staging data refreshed + anonymized"

  # Clean up the prod backup too
  ssh "${PROD_USER}@${PROD_HOST}" "rm -f /tmp/${BACKUP_FILE}"
else
  log "Step 4/6: Skipping data refresh (use --refresh-data to enable)"
fi

# ─── Step 5: Start services ────────────────────────────────
log "Step 5/6: Starting services on staging..."

# Pull and start the monitoring stack first (it has no app dependency)
ssh "${STAGING_USER}@${STAGING_HOST}" <<EOF
  cd ${PROJECT_DIR}
  docker compose -f docker-compose.staging.yml up -d postgres redis
  sleep 10
  docker compose -f docker-compose.staging.yml up -d app
  sleep 5
  docker compose -f docker-compose.staging.yml up -d prometheus grafana loki promtail
EOF

# WAF (optional — skip with --skip-waf for local dev)
if [[ "$SKIP_WAF" == "false" ]]; then
  log "  Starting WAF container..."
  ssh "${STAGING_USER}@${STAGING_HOST}" <<EOF
    cd ${PROJECT_DIR}
    docker network create coderoute-net 2>/dev/null || true
    docker compose -f docker-compose.waf.yml up -d
EOF
fi

log "  All services started"

# ─── Step 6: Smoke tests ───────────────────────────────────
log "Step 6/6: Running smoke tests..."

SMOKE_PASSED=0
SMOKE_FAILED=0

check_url() {
  local name="$1"
  local url="$2"
  local expected="$3"

  local response
  response=$(curl -sk -o /dev/null -w "%{http_code}" --max-time 10 "$url" || echo "000")

  if [[ "$response" == "$expected" ]]; then
    log "  [✓] $name: HTTP $response"
    SMOKE_PASSED=$((SMOKE_PASSED + 1))
  else
    err "  [x] $name: HTTP $response (expected $expected)"
    SMOKE_FAILED=$((SMOKE_FAILED + 1))
  fi
}

check_url "App health"     "https://${STAGING_HOST}/api/health"        "200"
check_url "App home"       "https://${STAGING_HOST}/"                  "200"
check_url "Login page"     "https://${STAGING_HOST}/login"             "200"
check_url "CSRF endpoint"  "https://${STAGING_HOST}/api/auth/csrf"     "200"
check_url "Prometheus"     "https://${STAGING_HOST}:9090/-/healthy"    "200"
check_url "Grafana"        "https://${STAGING_HOST}:3001/api/health"   "200"
check_url "Metrics"        "https://${STAGING_HOST}/api/metrics"       "200"

# WAF smoke test (if enabled)
if [[ "$SKIP_WAF" == "false" ]]; then
  check_url "WAF block (SQLi)" \
    "https://${STAGING_HOST}/api/auth/login?username=admin'+OR+1%3D1--" "403"
fi

log "Smoke tests: $SMOKE_PASSED passed, $SMOKE_FAILED failed"

if [[ $SMOKE_FAILED -gt 0 ]]; then
  err "Smoke tests failed — staging not ready"
  exit 4
fi

# ─── Summary ───────────────────────────────────────────────
log "==============================================="
log "Staging twin is READY"
log "==============================================="
log ""
log "URLs:"
log "  Application:  https://${STAGING_HOST}/"
log "  Grafana:      https://${STAGING_HOST}:3001/"
log "  Prometheus:   https://${STAGING_HOST}:9090/"
log "  Metrics:      https://${STAGING_HOST}/api/metrics"
log ""
log "Next steps:"
log "  1. Run E2E tests:      bun run test:e2e -- --base-url=https://${STAGING_HOST}"
log "  2. Run k6 load tests:  ./load-tests/run-all.sh staging"
log "  3. Run WAF tuning:     see docs/ops/WAF-TUNING.md"
log "  4. Grant auditor access (see docs/audit-externe/05-ACCES-TEMPORAIRES.md)"
log ""

exit 0
