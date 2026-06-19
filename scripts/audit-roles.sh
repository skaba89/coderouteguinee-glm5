#!/bin/bash
# Comprehensive 5-role audit script using agent-browser
set -u

BASE="http://localhost:3000"
SHOTS="/home/z/my-project/download/screenshots/phase24"
mkdir -p "$SHOTS"

# Helper: extract first ref (eNN) from a snapshot line matching pattern
get_ref () {
  echo "$1" | grep "$2" | grep -oE 'e[0-9]+' | head -1
}

login_and_audit () {
  local ROLE="$1"
  local EMAIL="$2"
  local PASS="$3"
  local LABEL="$4"

  echo ""
  echo "=============================================="
  echo "  AUDIT: $ROLE ($LABEL)"
  echo "=============================================="

  # Open home
  agent-browser open "$BASE/" >/dev/null 2>&1
  sleep 2

  # Click "Se connecter"
  local SNAP
  SNAP=$(agent-browser snapshot -i -c 2>/dev/null)
  local LOGIN_BTN
  LOGIN_BTN=$(get_ref "$SNAP" 'button "Se connecter"')
  if [ -z "$LOGIN_BTN" ]; then
    echo "❌ Login button not found"
    return 1
  fi
  echo "Login button ref: $LOGIN_BTN"
  agent-browser click "@${LOGIN_BTN}" >/dev/null 2>&1
  sleep 1

  # Get refs for email/password/submit
  SNAP=$(agent-browser snapshot -i -c 2>/dev/null)
  EMAIL_REF=$(get_ref "$SNAP" 'textbox "Email"')
  PASS_REF=$(get_ref "$SNAP" 'textbox "Mot de passe"')
  SUBMIT_REF=$(get_ref "$SNAP" 'button "Se connecter"')

  echo "Refs: email=$EMAIL_REF pass=$PASS_REF submit=$SUBMIT_REF"

  agent-browser fill "@${EMAIL_REF}" "$EMAIL" >/dev/null 2>&1
  agent-browser fill "@${PASS_REF}" "$PASS" >/dev/null 2>&1
  sleep 0.5
  agent-browser click "@${SUBMIT_REF}" >/dev/null 2>&1
  sleep 3

  # Snapshot dashboard
  agent-browser screenshot "$SHOTS/${ROLE}-01-dashboard.png" >/dev/null 2>&1
  local DASH
  DASH=$(agent-browser snapshot -c 2>/dev/null)
  echo "--- Dashboard snapshot (first 25 lines) ---"
  echo "$DASH" | head -25

  # Get console errors
  echo ""
  echo "--- Console errors for $ROLE ---"
  agent-browser console --level error 2>/dev/null | head -10

  # Role-specific keyword check
  echo ""
  echo "--- Role keywords for $ROLE ---"
  case "$ROLE" in
    super-admin)
      echo "$DASH" | grep -iE "Paiements|Banque|Cours|Notifications|Utilisateurs|audit|ensemble" | head -8
      ;;
    administration)
      echo "$DASH" | grep -iE "Inspecteur|Administration|servation|Examen|Centre|ensemble" | head -8
      ;;
    centre-agree)
      echo "$DASH" | grep -iE "Centre|servation|Planning|Statistique|ensemble" | head -8
      ;;
    auto-ecole)
      echo "$DASH" | grep -iE "cole|ves|Analytics|Tableau|ensemble" | head -8
      ;;
    candidat)
      echo "$DASH" | grep -iE "Cours|Examen|servation|Bienvenue|Tableau" | head -8
      ;;
  esac

  # Logout: close browser session entirely to clear all auth state
  agent-browser close --all >/dev/null 2>&1
  sleep 1
}

echo "Starting 5-role audit at $(date)"

login_and_audit "super-admin" "admin@coderoute-gn.org" "Admin@2026" "Administrateur principal"
login_and_audit "administration" "inspecteur@coderoute-gn.org" "Inspect@2026" "Inspecteur / Administration"
login_and_audit "centre-agree" "centre@coderoute-gn.org" "Centre@2026" "Centre agréé"
login_and_audit "auto-ecole" "autoecole@demo.gn" "AutoEcole@2026" "Auto-école"
login_and_audit "candidat" "candidat@demo.gn" "Candidat@2026" "Candidat"

echo ""
echo "=============================================="
echo "  AUDIT TERMINÉ — Captures dans $SHOTS/"
echo "=============================================="
ls -la "$SHOTS/" 2>&1 | head -20
