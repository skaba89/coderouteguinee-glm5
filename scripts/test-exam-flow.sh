#!/bin/bash
# Test exam flow - use snapshot-based refs since they're reliable
set -u
BASE="http://localhost:3000"
SHOTS="/home/z/my-project/download/screenshots/phase25"
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
  agent-browser click "@$(get_ref "$SNAP" 'button "Se connecter"')" >/dev/null 2>&1
  sleep 1
  SNAP=$(agent-browser snapshot -i -c 2>/dev/null)
  agent-browser fill "@$(get_ref "$SNAP" 'textbox "Email"')" "$EMAIL" >/dev/null 2>&1
  agent-browser fill "@$(get_ref "$SNAP" 'textbox "Mot de passe"')" "$PASS" >/dev/null 2>&1
  sleep 0.5
  agent-browser click "@$(get_ref "$SNAP" 'button "Se connecter"')" >/dev/null 2>&1
  sleep 3
}

echo "===== CANDIDAT: Test Examen end-to-end ====="
login "candidat@demo.gn" "Candidat@2026"

# Go to Entraînement
SNAP=$(agent-browser snapshot -i -c 2>/dev/null)
agent-browser click "@$(echo "$SNAP" | grep 'button "Entraînement"' | grep -oE 'e[0-9]+' | tail -1)" >/dev/null 2>&1
sleep 3

# Start exam
SNAP=$(agent-browser snapshot -i -c 2>/dev/null)
agent-browser click "@$(echo "$SNAP" | grep 'button "Commencer l.examen"' | grep -oE 'e[0-9]+' | head -1)" >/dev/null 2>&1
sleep 4
agent-browser screenshot "$SHOTS/candidat-03-exam-q1.png" >/dev/null 2>&1

# Loop answering questions
for i in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20; do
  SNAP=$(agent-browser snapshot -i -c 2>/dev/null)
  # Click option B (snapshot shows it as "button 'B <text>'")
  B_REF=$(echo "$SNAP" | grep -E 'button "B ' | grep -oE 'e[0-9]+' | head -1)
  if [ -z "$B_REF" ]; then
    # Fallback: click A
    B_REF=$(echo "$SNAP" | grep -E 'button "A ' | grep -oE 'e[0-9]+' | head -1)
  fi
  if [ -n "$B_REF" ]; then
    agent-browser click "@${B_REF}" >/dev/null 2>&1
    sleep 0.5
  fi
  
  # Click Suivant / Terminer
  SNAP=$(agent-browser snapshot -i -c 2>/dev/null)
  NEXT_REF=$(echo "$SNAP" | grep -E 'button "Suivant"|button "Terminer' | grep -oE 'e[0-9]+' | head -1)
  if [ -n "$NEXT_REF" ]; then
    agent-browser click "@${NEXT_REF}" >/dev/null 2>&1
    sleep 1
  else
    echo "Q$i: no next button"
    break
  fi
  echo "Q$i: option=$B_REF next=$NEXT_REF"
done
agent-browser screenshot "$SHOTS/candidat-04-exam-progress.png" >/dev/null 2>&1

# Confirm submit dialog
echo ""
echo "=== Confirming submit ==="
SNAP=$(agent-browser snapshot -i -c 2>/dev/null)
CONFIRM_REF=$(echo "$SNAP" | grep -E 'button "Confirmer|button "OK"|button "Valider' | grep -oE 'e[0-9]+' | head -1)
if [ -n "$CONFIRM_REF" ]; then
  echo "Confirm ref: $CONFIRM_REF"
  agent-browser click "@${CONFIRM_REF}" >/dev/null 2>&1
  sleep 5
fi
agent-browser screenshot "$SHOTS/candidat-05-exam-results.png" >/dev/null 2>&1
echo ""
echo "=== Results page ==="
agent-browser snapshot -c 2>/dev/null | head -50

agent-browser close --all >/dev/null 2>&1
echo ""
echo "===== Test examen terminé ====="
