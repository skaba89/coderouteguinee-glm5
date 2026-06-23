#!/usr/bin/env bash
# ============================================================
# CodeRoute Guinée — Audit external weekly tracking
# ============================================================
# Parses docs/audit-externe/PLAN-REMEDIATION.md and the audit
# calendar to produce a weekly status snapshot.
#
# Output:
#   - Console summary
#   - docs/audit-externe/sync/S{date}-audit-status.md
#
# Usage:
#   ./scripts/audit-weekly-tracking.sh
#   ./scripts/audit-weekly-tracking.sh --audit-start=2026-01-15
# ============================================================
set -uo pipefail

# ---------- Args ----------
AUDIT_START=""
PILOT_START="${PILOT_START_DATE:-}"
for arg in "$@"; do
  case "$arg" in
    --audit-start=*)
      AUDIT_START="${arg#*=}"
      ;;
    *)
      echo "⚠️  Unknown arg: $arg"
      ;;
  esac
done

PLAN_FILE="docs/audit-externe/PLAN-REMEDIATION.md"
CALENDAR_FILE="docs/audit-externe/CALENDRIER-AUDIT-45J.md"
SYNC_DIR="docs/audit-externe/sync"
mkdir -p "$SYNC_DIR"

# Read file content robustly (some overlay filesystems have stale inode cache
# that makes `test -f` and `[[ -f ]]` return false even when the file exists
# and is readable via cat). Using cat + heredoc is more reliable.
read_file() {
  local f="$1"
  cat "$f" 2>/dev/null || true
}

PLAN_CONTENT="$(read_file "$PLAN_FILE")"
CALENDAR_CONTENT="$(read_file "$CALENDAR_FILE")"

if [[ -z "$PLAN_CONTENT" ]]; then
  echo "❌ PLAN-REMEDIATION.md not readable at $PLAN_FILE"
  exit 1
fi
if [[ -z "$CALENDAR_CONTENT" ]]; then
  echo "❌ CALENDARIER-AUDIT-45J.md not readable at $CALENDAR_FILE"
  exit 1
fi

TODAY=$(date +%Y-%m-%d)
TODAY_TS=$(date -d "$TODAY" +%s 2>/dev/null || date -j -f "%Y-%m-%d" "$TODAY" +%s)

if [[ -z "$AUDIT_START" ]]; then
  echo "⚠️  --audit-start not provided. Using today as audit start."
  AUDIT_START="$TODAY"
fi
AUDIT_START_TS=$(date -d "$AUDIT_START" +%s 2>/dev/null || date -j -f "%Y-%m-%d" "$AUDIT_START" +%s)
DAYS_SINCE_START=$(( (TODAY_TS - AUDIT_START_TS) / 86400 ))
DAYS_REMAINING=$(( 45 - DAYS_SINCE_START ))
if [[ $DAYS_REMAINING -lt 0 ]]; then
  DAYS_REMAINING=0
fi
AVANCEMENT_PCT=$(( (DAYS_SINCE_START * 100) / 45 ))
if [[ $AVANCEMENT_PCT -gt 100 ]]; then
  AVANCEMENT_PCT=100
fi

# Phase determination (per CALENDARIER-AUDIT-45J.md)
if [[ $DAYS_SINCE_START -lt 0 ]]; then
  PHASE="Phase 0 — Préparation"
elif [[ $DAYS_SINCE_START -le 5 ]]; then
  PHASE="Phase 1 — Cadrage"
elif [[ $DAYS_SINCE_START -le 12 ]]; then
  PHASE="Phase 2 — SAST & configuration"
elif [[ $DAYS_SINCE_START -le 25 ]]; then
  PHASE="Phase 3 — Pentest"
elif [[ $DAYS_SINCE_START -le 32 ]]; then
  PHASE="Phase 4 — Conformité RGPD"
elif [[ $DAYS_SINCE_START -le 42 ]]; then
  PHASE="Phase 5 — Synthèse & rédaction"
elif [[ $DAYS_SINCE_START -le 45 ]]; then
  PHASE="Phase 6 — Restitution & clôture"
else
  PHASE="Post-audit (clôturé)"
fi

# ---------- Parse PLAN-REMEDIATION.md ----------
# Match lines like: | C-001 | P0 | ... | Ouvert | or | C-002 | P1 | ... | Clôturé |
TOTAL=0
P0_TOTAL=0; P0_OPEN=0; P0_CLOSED=0
P1_TOTAL=0; P1_OPEN=0; P1_CLOSED=0
P2_TOTAL=0; P2_OPEN=0; P2_CLOSED=0
P3_TOTAL=0; P3_OPEN=0; P3_CLOSED=0
P4_TOTAL=0; P4_OPEN=0; P4_CLOSED=0

while IFS= read -r line; do
  [[ "$line" != \|* ]] && continue
  if echo "$line" | grep -qiE "ID|Sévérité|Sévé|Statut|---"; then
    continue
  fi
  sev=$(echo "$line" | grep -oE "P[0-4]" | head -1 || true)
  [[ -z "$sev" ]] && continue
  if echo "$line" | grep -qiE "Clôturé|Closed|Fermé|Remédié|Re-test OK|Validé"; then
    status="closed"
  elif echo "$line" | grep -qiE "Ouvert|Open|En cours|À remédier|Planifié"; then
    status="open"
  else
    status="open"
  fi
  TOTAL=$((TOTAL + 1))
  case "$sev" in
    P0) P0_TOTAL=$((P0_TOTAL + 1)); [[ "$status" == "closed" ]] && P0_CLOSED=$((P0_CLOSED + 1)) || P0_OPEN=$((P0_OPEN + 1)) ;;
    P1) P1_TOTAL=$((P1_TOTAL + 1)); [[ "$status" == "closed" ]] && P1_CLOSED=$((P1_CLOSED + 1)) || P1_OPEN=$((P1_OPEN + 1)) ;;
    P2) P2_TOTAL=$((P2_TOTAL + 1)); [[ "$status" == "closed" ]] && P2_CLOSED=$((P2_CLOSED + 1)) || P2_OPEN=$((P2_OPEN + 1)) ;;
    P3) P3_TOTAL=$((P3_TOTAL + 1)); [[ "$status" == "closed" ]] && P3_CLOSED=$((P3_CLOSED + 1)) || P3_OPEN=$((P3_OPEN + 1)) ;;
    P4) P4_TOTAL=$((P4_TOTAL + 1)); [[ "$status" == "closed" ]] && P4_CLOSED=$((P4_CLOSED + 1)) || P4_OPEN=$((P4_OPEN + 1)) ;;
  esac
done <<< "$PLAN_CONTENT"

TOTAL_OPEN=$((P0_OPEN + P1_OPEN + P2_OPEN + P3_OPEN + P4_OPEN))
TOTAL_CLOSED=$((P0_CLOSED + P1_CLOSED + P2_CLOSED + P3_CLOSED + P4_CLOSED))
REMEDIATION_RATE=0
if [[ $TOTAL -gt 0 ]]; then
  REMEDIATION_RATE=$(( (TOTAL_CLOSED * 100) / TOTAL ))
fi

# ---------- Determine current week number ----------
if [[ -n "$PILOT_START" ]]; then
  PILOT_START_TS=$(date -d "$PILOT_START" +%s 2>/dev/null || date -j -f "%Y-%m-%d" "$PILOT_START" +%s)
  WEEK_NUM=$(( (TODAY_TS - PILOT_START_TS) / 604800 + 1 ))
  if [[ $WEEK_NUM -lt 1 ]]; then WEEK_NUM=1; fi
else
  WEEK_NUM="?"
fi

# ---------- Output ----------
OUT_FILE="$SYNC_DIR/${TODAY}-audit-status.md"

cat > "$OUT_FILE" <<EOF
# Suivi Audit Externe — ${TODAY}

**Semaine pilote** : S${WEEK_NUM}
**Date audit start** : ${AUDIT_START}
**Jours écoulés** : ${DAYS_SINCE_START} / 45
**Jours restants** : ${DAYS_REMAINING}
**Avancement global** : ${AVANCEMENT_PCT}%
**Phase en cours** : ${PHASE}

---

## Constats cumulés (depuis démarrage audit)

| Sévérité | Total | Ouverts | Clôturés | Taux remédiation |
|----------|-------|---------|----------|-------------------|
| P0 | ${P0_TOTAL} | ${P0_OPEN} | ${P0_CLOSED} | $([[ $P0_TOTAL -gt 0 ]] && echo $(( (P0_CLOSED * 100) / P0_TOTAL )) || echo 0)% |
| P1 | ${P1_TOTAL} | ${P1_OPEN} | ${P1_CLOSED} | $([[ $P1_TOTAL -gt 0 ]] && echo $(( (P1_CLOSED * 100) / P1_TOTAL )) || echo 0)% |
| P2 | ${P2_TOTAL} | ${P2_OPEN} | ${P2_CLOSED} | $([[ $P2_TOTAL -gt 0 ]] && echo $(( (P2_CLOSED * 100) / P2_TOTAL )) || echo 0)% |
| P3 | ${P3_TOTAL} | ${P3_OPEN} | ${P3_CLOSED} | $([[ $P3_TOTAL -gt 0 ]] && echo $(( (P3_CLOSED * 100) / P3_TOTAL )) || echo 0)% |
| P4 | ${P4_TOTAL} | ${P4_OPEN} | ${P4_CLOSED} | $([[ $P4_TOTAL -gt 0 ]] && echo $(( (P4_CLOSED * 100) / P4_TOTAL )) || echo 0)% |
| **Total** | **${TOTAL}** | **${TOTAL_OPEN}** | **${TOTAL_CLOSED}** | **${REMEDIATION_RATE}%** |

## Alertes critiques (P0/P1 ouverts)

EOF

if [[ $P0_OPEN -gt 0 || $P1_OPEN -gt 0 ]]; then
  echo "| Sévérité | Nombre | Action requise |" >> "$OUT_FILE"
  echo "|----------|--------|----------------|" >> "$OUT_FILE"
  [[ $P0_OPEN -gt 0 ]] && echo "| P0 | ${P0_OPEN} | ⚠️  Correction sous 48h, notification direction |" >> "$OUT_FILE"
  [[ $P1_OPEN -gt 0 ]] && echo "| P1 | ${P1_OPEN} | Correction sous 7 jours, suivi CPS |" >> "$OUT_FILE"
else
  echo "_Aucun P0/P1 ouvert._" >> "$OUT_FILE"
fi

cat >> "$OUT_FILE" <<EOF

## Prochaines étapes (selon calendrier)

EOF

case "$PHASE" in
  "Phase 0 — Préparation")
    echo "- Validation convention audit + NDA" >> "$OUT_FILE"
    echo "- Préparation accès auditeurs (SSH, 2FA, IP allowlist)" >> "$OUT_FILE"
    echo "- Staging jumeau prod démarré" >> "$OUT_FILE"
    echo "- Briefing démarrage (J-1)" >> "$OUT_FILE"
    ;;
  "Phase 1 — Cadrage")
    echo "- Revue documentaire complète" >> "$OUT_FILE"
    echo "- Rapport cadrage (J+5)" >> "$OUT_FILE"
    echo "- Validation périmètre ajusté" >> "$OUT_FILE"
    ;;
  "Phase 2 — SAST & configuration")
    echo "- Scan Semgrep + npm audit + CodeQL" >> "$OUT_FILE"
    echo "- Revue configuration PostgreSQL/Redis/Nginx" >> "$OUT_FILE"
    echo "- Rapport SAST & config (J+12)" >> "$OUT_FILE"
    ;;
  "Phase 3 — Pentest")
    echo "- 35 scénarios pentest (auth, authz, injection, logique métier, fichiers, API, infra)" >> "$OUT_FILE"
    echo "- Tests charge k6 + slowloris" >> "$OUT_FILE"
    echo "- Rapport pentest (J+25)" >> "$OUT_FILE"
    ;;
  "Phase 4 — Conformité RGPD")
    echo "- Revue articles 5-43 Loi L/2022/018/AN" >> "$OUT_FILE"
    echo "- Tests pratiques (droits personnes, notification violation)" >> "$OUT_FILE"
    echo "- Rapport conformité RGPD (J+32)" >> "$OUT_FILE"
    ;;
  "Phase 5 — Synthèse & rédaction")
    echo "- Rédaction rapport final (80-130 pages)" >> "$OUT_FILE"
    echo "- Relecture par pair cabinet" >> "$OUT_FILE"
    echo "- Rapport provisoire (J+42)" >> "$OUT_FILE"
    ;;
  "Phase 6 — Restitution & clôture")
    echo "- Présentation officielle (J+43)" >> "$OUT_FILE"
    echo "- Traitement retours MOA (J+44)" >> "$OUT_FILE"
    echo "- Clôture + révocation accès (J+45)" >> "$OUT_FILE"
    echo "- Exécuter scripts/revoke-auditor-access.sh" >> "$OUT_FILE"
    ;;
  *)
    echo "- Audit clôturé. Suivi remédiation post-audit via PLAN-REMEDIATION.md" >> "$OUT_FILE"
    ;;
esac

cat >> "$OUT_FILE" <<EOF

## Blocages & escalations

À remplir manuellement après la sync hebdo avec l'auditeur.

---

## Liens utiles

- Plan remédiation : \`docs/audit-externe/PLAN-REMEDIATION.md\`
- Calendrier audit : \`docs/audit-externe/CALENDARIER-AUDIT-45J.md\`
- Manuel auditeur : \`docs/audit-externe/MANUEL-AUDITEUR.md\`
- Registre violations : \`docs/audit-externe/REGISTRE-VIOLATIONS.md\`
- Sync précédentes : \`docs/audit-externe/sync/\`

---

**Généré par** : \`scripts/audit-weekly-tracking.sh\` le ${TODAY}
**Classification** : Confidentiel DNTT + cabinet d'audit
EOF

# ---------- Console summary ----------
echo ""
echo "=========================================="
echo "   Suivi Audit Externe — ${TODAY}"
echo "=========================================="
echo "Phase en cours        : ${PHASE}"
echo "Jours écoulés / 45    : ${DAYS_SINCE_START}"
echo "Jours restants        : ${DAYS_REMAINING}"
echo "Avancement global     : ${AVANCEMENT_PCT}%"
echo ""
echo "Constats cumulés      : ${TOTAL} (P0:${P0_TOTAL} P1:${P1_TOTAL} P2:${P2_TOTAL} P3:${P3_TOTAL} P4:${P4_TOTAL})"
echo "  - Ouverts           : ${TOTAL_OPEN}"
echo "  - Clôturés          : ${TOTAL_CLOSED}"
echo "  - Taux remédiation  : ${REMEDIATION_RATE}%"
echo ""
if [[ $P0_OPEN -gt 0 ]]; then
  echo "⚠️  ${P0_OPEN} P0 ouvert(s) — action immédiate requise!"
fi
if [[ $P1_OPEN -gt 0 ]]; then
  echo "⚠️  ${P1_OPEN} P1 ouvert(s) — correction sous 7 jours"
fi
echo ""
echo "📄 Rapport complet : ${OUT_FILE}"
echo ""
