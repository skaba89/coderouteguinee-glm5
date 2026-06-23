#!/usr/bin/env bash
# ============================================================
# CodeRoute Guinée — Audit Remediation Stats (Sprint 13)
# ============================================================
# Parses docs/audit-externe/PLAN-REMEDIATION.md and outputs
# consolidated statistics for the weekly security committee.
# ============================================================

set -euo pipefail

PLAN_FILE="${1:-docs/audit-externe/PLAN-REMEDIATION.md}"

if [[ ! -f "$PLAN_FILE" ]]; then
  echo "Error: $PLAN_FILE not found" >&2
  exit 1
fi

# Extract the dashboard table rows (lines starting with "| A-")
echo "SÉVÉRITÉ       TOTAL   OPEN    IN_PROGRESS   CLOSED"
echo "---------------------------------------------------"

for severity in Critique Élevée Moyenne Basse Information; do
  total=$(grep -c "|.*|$severity|" "$PLAN_FILE" 2>/dev/null || echo 0)
  open=$(grep "|.*|$severity.*|OPEN" "$PLAN_FILE" 2>/dev/null | wc -l || echo 0)
  in_prog=$(grep "|.*|$severity.*|IN_PROGRESS" "$PLAN_FILE" 2>/dev/null | wc -l || echo 0)
  closed=$(grep "|.*|$severity.*|CLOSED" "$PLAN_FILE" 2>/dev/null | wc -l || echo 0)

  printf "%-14s %-8s %-8s %-14s %s\n" "$severity" "$total" "$open" "$in_prog" "$closed"
done

echo "---------------------------------------------------"

# Compute totals
total_all=$(grep -c "^| A-" "$PLAN_FILE" 2>/dev/null || echo 0)
open_all=$(grep -c "| OPEN " "$PLAN_FILE" 2>/dev/null || echo 0)
closed_all=$(grep -c "| CLOSED " "$PLAN_FILE" 2>/dev/null || echo 0)

if [[ "$total_all" -gt 0 ]]; then
  rate=$(( (closed_all * 100) / total_all ))
else
  rate=0
fi

echo ""
echo "TOTAL          $total_all   OPEN: $open_all   CLOSED: $closed_all"
echo "TAUX DE REMÉDIATION : ${rate}%"
echo ""
echo "Généré le : $(date -u +%Y-%m-%dT%H:%M:%SZ)"
