#!/bin/bash
# ============================================================
# CodeRoute Guinée — Pre-deploy security checklist (Sprint 1)
# ============================================================
# Run this BEFORE deploying to production. It checks that:
#   1. NODE_ENV=production
#   2. All required secrets are set and strong enough
#   3. DATABASE_URL points to PostgreSQL (not SQLite)
#   4. No hardcoded test passwords in source code
#   5. .env.production is not committed to git
#   6. TypeScript compiles without errors
#   7. Jest tests pass
#
# Usage:
#   bash scripts/pre-deploy-checklist.sh
#
# Exit codes:
#   0 = all checks passed, ready to deploy
#   1 = one or more checks failed — DO NOT DEPLOY
# ============================================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASS=0
FAIL=0
WARN=0

check_pass() { echo -e "  ${GREEN}✓${NC} $1"; PASS=$((PASS+1)); }
check_fail() { echo -e "  ${RED}✗${NC} $1"; FAIL=$((FAIL+1)); }
check_warn() { echo -e "  ${YELLOW}⚠${NC} $1"; WARN=$((WARN+1)); }

echo "╔══════════════════════════════════════════════════════════╗"
echo "║  CodeRoute Guinée — Pre-deploy Checklist                 ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

ENV_FILE="${1:-.env.production}"

if [ ! -f "$ENV_FILE" ]; then
  echo -e "${RED}Error: $ENV_FILE not found.${NC}"
  echo "Run: bash scripts/generate-secrets.sh > $ENV_FILE"
  exit 1
fi

# Source the env file (carefully — only exports, no commands)
set -a
# shellcheck disable=SC1090
source <(grep -E '^[A-Z_]+=' "$ENV_FILE" | sed 's/^/export /')
set +a

# ─── 1. NODE_ENV ──────────────────────────────────────────
echo "1. Environment"
if [ "${NODE_ENV:-}" = "production" ]; then
  check_pass "NODE_ENV=production"
else
  check_fail "NODE_ENV must be 'production' (got '${NODE_ENV:-<unset>}')"
fi
echo ""

# ─── 2. Required secrets ──────────────────────────────────
echo "2. Cryptographic secrets (min 32 chars)"
for SECRET_VAR in SESSION_SECRET JWT_SECRET CSRF_SECRET CRON_SECRET; do
  VAL="${!SECRET_VAR:-}"
  if [ -z "$VAL" ]; then
    check_fail "$SECRET_VAR is not set"
  elif [ ${#VAL} -lt 32 ]; then
    check_fail "$SECRET_VAR is too short (${#VAL} chars, need 32+)"
  elif echo "$VAL" | grep -qiE "change-me|test-|demo-|placeholder"; then
    check_fail "$SECRET_VAR contains a placeholder value"
  else
    check_pass "$SECRET_VAR is set (${#VAL} chars)"
  fi
done
echo ""

# ─── 3. Database ──────────────────────────────────────────
echo "3. Database"
if echo "${DATABASE_URL:-}" | grep -q "^postgresql://\|^postgres://"; then
  check_pass "DATABASE_URL points to PostgreSQL"
elif echo "${DATABASE_URL:-}" | grep -q "^file:"; then
  check_fail "DATABASE_URL points to SQLite — NOT recommended for production"
else
  check_fail "DATABASE_URL is not set or has unknown scheme"
fi

if [ -n "${POSTGRES_PASSWORD:-}" ]; then
  if [ ${#POSTGRES_PASSWORD} -ge 16 ]; then
    check_pass "POSTGRES_PASSWORD is set (${#POSTGRES_PASSWORD} chars)"
  else
    check_warn "POSTGRES_PASSWORD is short (${#POSTGRES_PASSWORD} chars, recommend 16+)"
  fi
else
  check_fail "POSTGRES_PASSWORD is not set"
fi
echo ""

# ─── 4. Seed passwords (required for first deploy) ────────
echo "4. Seed passwords"
for PW_VAR in SEED_ADMIN_PASSWORD SEED_INSPECTOR_PASSWORD SEED_CENTRE_PASSWORD SEED_CANDIDAT_PASSWORD; do
  VAL="${!PW_VAR:-}"
  if [ -z "$VAL" ]; then
    check_warn "$PW_VAR is not set (seed will fail in production)"
  elif [ ${#VAL} -lt 8 ]; then
    check_fail "$PW_VAR is too short (${#VAL} chars, need 8+)"
  else
    check_pass "$PW_VAR is set"
  fi
done
echo ""

# ─── 5. Email ─────────────────────────────────────────────
echo "5. Email (SMTP)"
if [ -n "${SMTP_HOST:-}" ]; then
  check_pass "SMTP_HOST is set"
else
  check_warn "SMTP_HOST is not set — emails will not be sent"
fi
if [ -n "${SMTP_FROM_EMAIL:-}" ]; then
  if echo "${SMTP_FROM_EMAIL}" | grep -q "@"; then
    check_pass "SMTP_FROM_EMAIL looks valid"
  else
    check_fail "SMTP_FROM_EMAIL is not a valid email"
  fi
else
  check_warn "SMTP_FROM_EMAIL is not set"
fi
echo ""

# ─── 6. SMS ───────────────────────────────────────────────
echo "6. SMS provider"
if [ "${SMS_PROVIDER:-}" = "orange" ]; then
  if [ -z "${ORANGE_SMS_CLIENT_ID:-}" ] || [ -z "${ORANGE_SMS_CLIENT_SECRET:-}" ] || [ -z "${ORANGE_SMS_SENDER_ADDRESS:-}" ]; then
    check_fail "SMS_PROVIDER=orange but ORANGE_SMS_* credentials are incomplete"
  else
    check_pass "Orange SMS credentials are set"
  fi
elif [ "${SMS_PROVIDER:-}" = "console" ]; then
  check_warn "SMS_PROVIDER=console — no real SMS will be sent"
else
  check_pass "SMS_PROVIDER=${SMS_PROVIDER}"
fi
echo ""

# ─── 7. Mobile Money ──────────────────────────────────────
echo "7. Mobile Money"
if [ "${MOMO_PROVIDER:-}" = "mock" ]; then
  check_warn "MOMO_PROVIDER=mock — no real payments will be processed"
elif [ -z "${MOMO_API_KEY:-}" ]; then
  check_fail "MOMO_PROVIDER=${MOMO_PROVIDER} but MOMO_API_KEY is not set"
else
  check_pass "MOMO_PROVIDER=${MOMO_PROVIDER} with API key"
fi
echo ""

# ─── 8. Source code hygiene ───────────────────────────────
echo "8. Source code hygiene"
if grep -r "Admin@2024" --include="*.ts" --include="*.tsx" src/ e2e/ prisma/ 2>/dev/null | grep -v node_modules; then
  check_fail "Hardcoded 'Admin@2024' password found in source code"
else
  check_pass "No hardcoded 'Admin@2024' in source"
fi

if grep -r "Candidat@2024" --include="*.ts" --include="*.tsx" src/ e2e/ prisma/ 2>/dev/null | grep -v node_modules; then
  check_fail "Hardcoded 'Candidat@2024' password found in source code"
else
  check_pass "No hardcoded 'Candidat@2024' in source"
fi

if git check-ignore .env.production >/dev/null 2>&1; then
  check_pass ".env.production is git-ignored"
else
  check_fail ".env.production is NOT git-ignored — add to .gitignore!"
fi
echo ""

# ─── 9. TypeScript + tests ────────────────────────────────
echo "9. Build & tests (this takes ~30s)"
# Run in a clean subshell with NODE_ENV=test so tests don't pick up
# production env vars we sourced earlier.
if (NODE_ENV=test npx tsc --noEmit) 2>/dev/null; then
  check_pass "TypeScript compiles without errors"
else
  check_fail "TypeScript errors — fix with: npx tsc --noEmit"
fi

if (NODE_ENV=test npx jest --silent) 2>/dev/null; then
  check_pass "Jest tests pass"
else
  check_fail "Jest tests fail — fix with: npx jest"
fi
echo ""

# ─── Summary ──────────────────────────────────────────────
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  Summary                                                 ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo -e "  ${GREEN}Passed: $PASS${NC}"
echo -e "  ${YELLOW}Warnings: $WARN${NC}"
echo -e "  ${RED}Failed: $FAIL${NC}"
echo ""

if [ $FAIL -gt 0 ]; then
  echo -e "${RED}🚨 DO NOT DEPLOY — fix the failures above first.${NC}"
  exit 1
elif [ $WARN -gt 0 ]; then
  echo -e "${YELLOW}⚠ Deploy with caution — review the warnings above.${NC}"
  exit 0
else
  echo -e "${GREEN}✓ Ready to deploy!${NC}"
  echo "  Next: docker compose -f docker-compose.production.yml up -d --build"
  exit 0
fi
