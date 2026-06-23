#!/usr/bin/env bash
# ============================================================
# CodeRoute Guinée — k6 Load Test Orchestrator (Sprint 3)
# ============================================================
# Runs all k6 load test scenarios in sequence and aggregates
# the results into a single report.
#
# Prerequisites:
#   - k6 installed (https://k6.io/docs/get-started/installation/)
#   - Dev server running on http://localhost:3000 (npm run dev)
#   - For login test: TEST_PASSWORD env var set
#   - For exam test: TEST_SESSION_COOKIE env var set
#   - For webhook test: WEBHOOK_SECRET env var set
#
# Usage:
#   bash load-tests/run-all.sh           # run all tests
#   bash load-tests/run-all.sh --smoke   # quick smoke (low VUs)
# ============================================================

set -euo pipefail

# ─── Config ────────────────────────────────────────────────
BASE_URL="${BASE_URL:-http://localhost:3000}"
SMOKE_MODE=false
[[ "${1:-}" == "--smoke" ]] && SMOKE_MODE=true

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  CodeRoute Guinée — k6 Load Test Suite                   ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Target: ${YELLOW}${BASE_URL}${NC}"
echo -e "Mode:   ${YELLOW}$([[ "$SMOKE_MODE" == "true" ]] && echo "smoke" || echo "full")${NC}"
echo ""

# ─── Pre-flight checks ────────────────────────────────────
if ! command -v k6 &> /dev/null; then
  echo -e "${RED}✗ k6 is not installed.${NC}"
  echo "Install: https://k6.io/docs/get-started/installation/"
  exit 1
fi

echo -e "${GREEN}✓ k6 found: $(k6 version)${NC}"

# Check if target is reachable
if ! curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/api/health?quick=true" | grep -q "200"; then
  echo -e "${RED}✗ Target ${BASE_URL} is not reachable.${NC}"
  echo "Start the dev server with: npm run dev"
  exit 1
fi

echo -e "${GREEN}✓ Target ${BASE_URL} is reachable${NC}"
echo ""

# ─── Prepare results directory ────────────────────────────
mkdir -p "$(dirname "$0")/results"

# ─── Helper: run one scenario ─────────────────────────────
run_scenario() {
  local name="$1"
  local script="$2"
  local vus="$3"
  local duration="$4"
  local env_vars="${5:-}"

  echo -e "${BLUE}▶ Running: ${name}${NC}"
  echo -e "  Script: ${script}"
  echo -e "  VUs: ${vus}, Duration: ${duration}"

  if [[ "$SMOKE_MODE" == "true" ]]; then
    vus=5
    duration="15s"
    echo -e "  ${YELLOW}(smoke mode: VUs=${vus}, duration=${duration})${NC}"
  fi

  # shellcheck disable=SC2086
  if ! env BASE_URL="${BASE_URL}" ${env_vars} \
       k6 run --vus "${vus}" --duration "${duration}" "${script}"; then
    echo -e "${RED}✗ ${name} failed${NC}"
    return 1
  fi

  echo -e "${GREEN}✓ ${name} completed${NC}"
  echo ""
}

# ─── Run scenarios ─────────────────────────────────────────
FAILURES=0

# 1. Health endpoint — always works, no auth needed
run_scenario "Health Endpoint" \
  "$(dirname "$0")/health.js" 50 30s || FAILURES=$((FAILURES+1))

# 2. Login endpoint — needs TEST_PASSWORD
if [[ -z "${TEST_PASSWORD:-}" ]]; then
  echo -e "${YELLOW}⚠ TEST_PASSWORD not set — skipping login test${NC}"
  echo "  Set it via: TEST_PASSWORD=xxx bash load-tests/run-all.sh"
  echo ""
else
  run_scenario "Login Endpoint" \
    "$(dirname "$0")/login.js" 20 60s \
    "TEST_PASSWORD=${TEST_PASSWORD} TEST_EMAIL=${TEST_EMAIL:-candidat@demo.gn}" \
    || FAILURES=$((FAILURES+1))
fi

# 3. Exam submission — needs TEST_SESSION_COOKIE
if [[ -z "${TEST_SESSION_COOKIE:-}" ]]; then
  echo -e "${YELLOW}⚠ TEST_SESSION_COOKIE not set — skipping exam test${NC}"
  echo "  Authenticate first, then set TEST_SESSION_COOKIE=session=xxx"
  echo ""
else
  run_scenario "Exam Submission" \
    "$(dirname "$0")/exams.js" 10 60s \
    "TEST_SESSION_COOKIE=${TEST_SESSION_COOKIE}" \
    || FAILURES=$((FAILURES+1))
fi

# 4. Payment webhook — needs WEBHOOK_SECRET
if [[ -z "${WEBHOOK_SECRET:-}" ]]; then
  echo -e "${YELLOW}⚠ WEBHOOK_SECRET not set — skipping webhook test${NC}"
  echo "  Set it via: WEBHOOK_SECRET=xxx bash load-tests/run-all.sh"
  echo ""
else
  run_scenario "Payment Webhook" \
    "$(dirname "$0")/payment-webhook.js" 30 60s \
    "WEBHOOK_SECRET=${WEBHOOK_SECRET}" \
    || FAILURES=$((FAILURES+1))
fi

# ─── Summary ───────────────────────────────────────────────
echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Load Test Suite — Final Summary                         ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"

if [[ $FAILURES -eq 0 ]]; then
  echo -e "${GREEN}✓ All scenarios completed successfully${NC}"
  exit 0
else
  echo -e "${RED}✗ ${FAILURES} scenario(s) failed${NC}"
  echo "Check the JSON reports in load-tests/results/"
  exit 1
fi
