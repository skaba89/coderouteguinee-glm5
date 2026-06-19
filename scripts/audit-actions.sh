#!/bin/bash
# Per-role action tests: navigate through key features and screenshot
set -u
BASE="http://localhost:3000"
SHOTS="/home/z/my-project/download/screenshots/phase24"
mkdir -p "$SHOTS"

get_ref () { echo "$1" | grep "$2" | grep -oE 'e[0-9]+' | head -1; }

login () {
  local EMAIL="$1" PASS="$2"
  agent-browser close --all >/dev/null 2>&1
  sleep 1
  agent-browser open "$BASE/" >/dev/null 2>&1
  sleep 2
  local SNAP
  SNAP=$(agent-browser snapshot -i -c 2>/dev/null)
  local LOGIN_BTN
  LOGIN_BTN=$(get_ref "$SNAP" 'button "Se connecter"')
  agent-browser click "@${LOGIN_BTN}" >/dev/null 2>&1
  sleep 1
  SNAP=$(agent-browser snapshot -i -c 2>/dev/null)
  local EMAIL_REF PASS_REF SUBMIT_REF
  EMAIL_REF=$(get_ref "$SNAP" 'textbox "Email"')
  PASS_REF=$(get_ref "$SNAP" 'textbox "Mot de passe"')
  SUBMIT_REF=$(get_ref "$SNAP" 'button "Se connecter"')
  agent-browser fill "@${EMAIL_REF}" "$EMAIL" >/dev/null 2>&1
  agent-browser fill "@${PASS_REF}" "$PASS" >/dev/null 2>&1
  sleep 0.3
  agent-browser click "@${SUBMIT_REF}" >/dev/null 2>&1
  sleep 3
}

click_button_by_text () {
  local TEXT="$1"
  local SNAP
  SNAP=$(agent-browser snapshot -i -c 2>/dev/null)
  local REF
  REF=$(get_ref "$SNAP" "button \"$TEXT\"")
  if [ -n "$REF" ]; then
    agent-browser click "@${REF}" >/dev/null 2>&1
    sleep 2
    return 0
  fi
  return 1
}

# ════════════════════════════════════════════════════════════
# CANDIDAT — test cours + réservation + entraînement
# ════════════════════════════════════════════════════════════
echo ""
echo "===== CANDIDAT: Test Cours ====="
login "candidat@demo.gn" "Candidat@2026"
agent-browser screenshot "$SHOTS/candidat-01-dashboard.png" >/dev/null 2>&1

click_button_by_text "Cours"
agent-browser screenshot "$SHOTS/candidat-02-courses.png" >/dev/null 2>&1
agent-browser snapshot -c 2>/dev/null | head -25

echo ""
echo "===== CANDIDAT: Test Entraînement ====="
click_button_by_text "Entraînement"
sleep 2
agent-browser screenshot "$SHOTS/candidat-03-exam.png" >/dev/null 2>&1
agent-browser snapshot -c 2>/dev/null | head -20

echo ""
echo "===== CANDIDAT: Test Réservation ====="
click_button_by_text "Réserver"
sleep 1
agent-browser screenshot "$SHOTS/candidat-04-booking.png" >/dev/null 2>&1
agent-browser snapshot -c 2>/dev/null | head -20

# ════════════════════════════════════════════════════════════
# AUTO-ECOLE — test étudiants + statistiques
# ════════════════════════════════════════════════════════════
echo ""
echo "===== AUTO-ECOLE: Test Étudiants ====="
login "autoecole@demo.gn" "AutoEcole@2026"
agent-browser screenshot "$SHOTS/auto-ecole-01-dashboard.png" >/dev/null 2>&1

click_button_by_text "Étudiants"
sleep 2
agent-browser screenshot "$SHOTS/auto-ecole-02-students.png" >/dev/null 2>&1
agent-browser snapshot -c 2>/dev/null | head -20

echo ""
echo "===== AUTO-ECOLE: Test Statistiques ====="
click_button_by_text "Statistiques"
sleep 2
agent-browser screenshot "$SHOTS/auto-ecole-03-stats.png" >/dev/null 2>&1
agent-browser snapshot -c 2>/dev/null | head -20

# ════════════════════════════════════════════════════════════
# CENTRE-AGREE — test réservations + planning
# ════════════════════════════════════════════════════════════
echo ""
echo "===== CENTRE-AGREE: Test Réservations ====="
login "centre@coderoute-gn.org" "Centre@2026"
agent-browser screenshot "$SHOTS/centre-agree-01-dashboard.png" >/dev/null 2>&1

click_button_by_text "Réservations"
sleep 2
agent-browser screenshot "$SHOTS/centre-agree-02-reservations.png" >/dev/null 2>&1
agent-browser snapshot -c 2>/dev/null | head -20

echo ""
echo "===== CENTRE-AGREE: Test Planning ====="
click_button_by_text "Planning"
sleep 2
agent-browser screenshot "$SHOTS/centre-agree-03-planning.png" >/dev/null 2>&1
agent-browser snapshot -c 2>/dev/null | head -20

# ════════════════════════════════════════════════════════════
# ADMINISTRATION — test centres + réservations
# ════════════════════════════════════════════════════════════
echo ""
echo "===== ADMINISTRATION: Test Centres ====="
login "inspecteur@coderoute-gn.org" "Inspect@2026"
agent-browser screenshot "$SHOTS/administration-01-dashboard.png" >/dev/null 2>&1

click_button_by_text "Centres"
sleep 2
agent-browser screenshot "$SHOTS/administration-02-centres.png" >/dev/null 2>&1
agent-browser snapshot -c 2>/dev/null | head -20

# ════════════════════════════════════════════════════════════
# SUPER-ADMIN — test paiements + notifications + banque questions
# ════════════════════════════════════════════════════════════
echo ""
echo "===== SUPER-ADMIN: Test Paiements ====="
login "admin@coderoute-gn.org" "Admin@2026"
agent-browser screenshot "$SHOTS/super-admin-01-dashboard.png" >/dev/null 2>&1

click_button_by_text "Paiements"
sleep 2
agent-browser screenshot "$SHOTS/super-admin-02-payments.png" >/dev/null 2>&1
agent-browser snapshot -c 2>/dev/null | head -15

echo ""
echo "===== SUPER-ADMIN: Test Banque questions ====="
click_button_by_text "Banque questions"
sleep 2
agent-browser screenshot "$SHOTS/super-admin-03-questions.png" >/dev/null 2>&1
agent-browser snapshot -c 2>/dev/null | head -15

echo ""
echo "===== SUPER-ADMIN: Test Cours ====="
click_button_by_text "Cours"
sleep 2
agent-browser screenshot "$SHOTS/super-admin-04-courses.png" >/dev/null 2>&1
agent-browser snapshot -c 2>/dev/null | head -15

echo ""
echo "===== SUPER-ADMIN: Test Notifications ====="
click_button_by_text "Notifications"
sleep 2
agent-browser screenshot "$SHOTS/super-admin-05-notifications.png" >/dev/null 2>&1
agent-browser snapshot -c 2>/dev/null | head -15

echo ""
echo "===== SUPER-ADMIN: Test Utilisateurs ====="
click_button_by_text "Utilisateurs"
sleep 2
agent-browser screenshot "$SHOTS/super-admin-06-users.png" >/dev/null 2>&1
agent-browser snapshot -c 2>/dev/null | head -15

agent-browser close --all >/dev/null 2>&1
echo ""
echo "===== CAPTURES TERMINÉES ====="
ls -la "$SHOTS/" | tail -25
