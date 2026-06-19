#!/bin/bash
# Verify super-admin sidebar items work properly
set -u
BASE="http://localhost:3000"
SHOTS="/home/z/my-project/download/screenshots/phase24"
mkdir -p "$SHOTS"

agent-browser close --all >/dev/null 2>&1
sleep 1
agent-browser open "$BASE/" >/dev/null 2>&1
sleep 2

# Login as super-admin
SNAP=$(agent-browser snapshot -i -c 2>/dev/null)
LOGIN_BTN=$(echo "$SNAP" | grep 'button "Se connecter"' | grep -oE 'e[0-9]+' | head -1)
agent-browser click "@${LOGIN_BTN}" >/dev/null 2>&1
sleep 1
SNAP=$(agent-browser snapshot -i -c 2>/dev/null)
EMAIL_REF=$(echo "$SNAP" | grep 'textbox "Email"' | grep -oE 'e[0-9]+' | head -1)
PASS_REF=$(echo "$SNAP" | grep 'textbox "Mot de passe"' | grep -oE 'e[0-9]+' | head -1)
SUBMIT_REF=$(echo "$SNAP" | grep 'button "Se connecter"' | grep -oE 'e[0-9]+' | head -1)
agent-browser fill "@${EMAIL_REF}" "admin@coderoute-gn.org" >/dev/null 2>&1
agent-browser fill "@${PASS_REF}" "Admin@2026" >/dev/null 2>&1
sleep 0.5
agent-browser click "@${SUBMIT_REF}" >/dev/null 2>&1
sleep 3

# Helper: click sidebar item (last matching button, since sidebar items appear after topbar)
click_sidebar_item () {
  local TEXT="$1"
  local SNAP
  SNAP=$(agent-browser snapshot -i -c 2>/dev/null)
  # Get the LAST matching ref (sidebar items are typically after topbar items)
  local REF
  REF=$(echo "$SNAP" | grep "button \"$TEXT\"" | grep -oE 'e[0-9]+' | tail -1)
  if [ -z "$REF" ]; then
    echo "  ❌ Sidebar item not found: $TEXT"
    return 1
  fi
  echo "  Clicking sidebar item '$TEXT' ref=$REF"
  agent-browser click "@${REF}" >/dev/null 2>&1
  sleep 2
  return 0
}

echo "===== SUPER-ADMIN: Sidebar items test ====="

echo ""
echo "--- Paiements ---"
click_sidebar_item "Paiements"
agent-browser screenshot "$SHOTS/super-admin-02-payments.png" >/dev/null 2>&1
agent-browser snapshot -c 2>/dev/null | grep -iE "Revenu|Confirm|Paiement|Transaction|montant|statut" | head -8

echo ""
echo "--- Banque questions ---"
click_sidebar_item "Banque questions"
agent-browser screenshot "$SHOTS/super-admin-03-questions.png" >/dev/null 2>&1
agent-browser snapshot -c 2>/dev/null | grep -iE "question|cat.gorie|difficult|filter|filtre" | head -8

echo ""
echo "--- Cours ---"
click_sidebar_item "Cours"
agent-browser screenshot "$SHOTS/super-admin-04-courses.png" >/dev/null 2>&1
agent-browser snapshot -c 2>/dev/null | grep -iE "cours|le.on|cat.gorie|dur.e|statut" | head -8

echo ""
echo "--- Utilisateurs ---"
click_sidebar_item "Utilisateurs"
agent-browser screenshot "$SHOTS/super-admin-06-users.png" >/dev/null 2>&1
agent-browser snapshot -c 2>/dev/null | grep -iE "utilisateur|user|email|role|nouvel" | head -8

echo ""
echo "--- Journal d'audit ---"
click_sidebar_item "Journal d'audit"
agent-browser screenshot "$SHOTS/super-admin-07-audit.png" >/dev/null 2>&1
agent-browser snapshot -c 2>/dev/null | grep -iE "audit|.v.nement|utilisateur|action|s.v.rit" | head -8

echo ""
echo "--- Système ---"
click_sidebar_item "Système"
agent-browser screenshot "$SHOTS/super-admin-08-system.png" >/dev/null 2>&1
agent-browser snapshot -c 2>/dev/null | head -15

echo ""
echo "--- Parametres ---"
click_sidebar_item "Parametres"
agent-browser screenshot "$SHOTS/super-admin-09-settings.png" >/dev/null 2>&1
agent-browser snapshot -c 2>/dev/null | head -15

agent-browser close --all >/dev/null 2>&1
echo ""
echo "===== SUPER-ADMIN sidebar test complete ====="
