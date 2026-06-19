#!/bin/bash
# ────────────────────────────────────────────────────────────
# Phase 2 — Generate missing + new media (sequential, rate-limit safe)
# ────────────────────────────────────────────────────────────

ROOT=/home/z/my-project
SIGNS=$ROOT/public/signs
SCEN=$ROOT/public/scenarios
COURS=$ROOT/public/courses
SIZE_SIG=1024x1024
SIZE_SCEN=1344x768

gen() {
  local out="$1"; local prompt="$2"; local size="${3:-$SIZE_SCEN}"
  if [ -f "$out" ] && [ $(stat -c%s "$out" 2>/dev/null) -gt 50000 ]; then
    echo "  ✓ exists: $(basename $out)"
    return 0
  fi
  echo "  ▶ generating: $(basename $out)"
  z-ai image -s "$size" -o "$out" -p "$prompt" 2>&1 | tail -1
  sleep 2
}

echo "▶ Missing signs referenced in seed.ts..."
gen "$SIGNS/obligation-droite.png" "European-style road sign on white background, blue circular sign with white right-pointing arrow indicating mandatory right direction. Clean professional vector illustration, no text, centered, isolated on white background, photo-realistic road sign" "$SIZE_SIG"
gen "$SIGNS/danger.png" "European-style generic danger warning road sign on white background, triangular sign with red border and white background, black exclamation mark in center indicating unspecified danger ahead. Clean professional vector illustration, no text, centered, isolated on white background, photo-realistic road sign" "$SIZE_SIG"
gen "$SIGNS/interdiction-stationner.png" "European-style no parking road sign on white background, circular sign with red border, blue background, single red diagonal line crossing through indicating no parking allowed. Clean professional vector illustration, no text, centered, isolated on white background, photo-realistic road sign" "$SIZE_SIG"

echo ""
echo "▶ New signs (additional Guinea context)..."
gen "$SIGNS/fin-interdiction-depasser.png" "European-style end of no-overtaking zone road sign on white background, circular sign with black border, white background, three black cars side view with diagonal black lines, indicating end of overtaking prohibition. Clean professional vector illustration, no text, centered, isolated on white background, photo-realistic road sign" "$SIZE_SIG"
gen "$SIGNS/rond-point-obligatoire.png" "European-style mandatory roundabout road sign on white background, blue circular sign with three white curved arrows arranged in clockwise rotation indicating roundabout mandatory. Clean professional vector illustration, no text, centered, isolated on white background, photo-realistic road sign" "$SIZE_SIG"
gen "$SIGNS/vitesse-30.png" "European-style speed limit road sign on white background, circular sign with red border and white background, black number 30 in center indicating 30 km/h speed limit. Clean professional vector illustration, no extra text, centered, isolated on white background, photo-realistic road sign" "$SIZE_SIG"
gen "$SIGNS/vitesse-90.png" "European-style speed limit road sign on white background, circular sign with red border and white background, black number 90 in center indicating 90 km/h speed limit. Clean professional vector illustration, no extra text, centered, isolated on white background, photo-realistic road sign" "$SIZE_SIG"

echo ""
echo "▶ New scenarios (Guinea context)..."
gen "$SCEN/moto-circulation-conakry.png" "Realistic driver view from a car in dense Conakry Guinea traffic. Yellow taxis, motorcycles weaving between cars, pedestrians near roadside stalls, colorful African market stalls in background, daytime, photo-realistic, high detail, driving school exam perspective"
gen "$SCEN/animaux-nuit.png" "Realistic driver view from a car at night on a rural Guinea road. Cattle crossing the road in dim headlights, dark savanna landscape, only car headlights illuminating the scene, tension atmosphere, photo-realistic, high detail, driving school exam perspective"
gen "$SCEN/zone-scolaire-approche.png" "Realistic driver view approaching a school zone in Kankan Guinea. Yellow diamond school warning sign visible on right side of road, children walking on roadside, school building with red roof in background, sandy terrain, daytime, photo-realistic, high detail, driving school exam perspective"
gen "$SCEN/carrefour-giratoire-nuit.png" "Realistic driver view approaching a roundabout at night in Conakry Guinea. Street lights illuminating the roundabout, cars circulating, traffic signs with reflective markings visible, modern buildings in background, dark sky, photo-realistic, high detail, driving school exam perspective"
gen "$SCEN/panneau-travaux.png" "Realistic driver view approaching roadworks on a Guinea national road. Orange construction signs, traffic cones redirecting traffic to one lane, construction workers in safety vests, partial road closure, sunny day, photo-realistic, high detail, driving school exam perspective"

echo ""
echo "▶ New course covers..."
gen "$COURS/cover-vitesse.png" "Modern educational banner image for a driving course on speed and safety distances in Guinea. Speedometer at 50 km/h with road and distance markers, dark blue background with red yellow green Guinea flag accent stripe. Professional e-learning course cover style, flat design illustration, no text"
gen "$COURS/cover-infractions.png" "Modern educational banner image for a driving course on traffic violations and fines in Guinea. Police cap with ticket book, gavel, red traffic light, fine receipt, dark blue background with red yellow green Guinea flag accent stripe. Professional e-learning course cover style, flat design illustration, no text"
gen "$COURS/cover-conduite-eco.png" "Modern educational banner image for a driving course on eco-driving in Guinea. Car with green leaf symbol, fuel gauge, dashboard display, dark blue background with red yellow green Guinea flag accent stripe. Professional e-learning course cover style, flat design illustration, no text"

echo ""
echo "▶ Done. Final inventory:"
echo "Signs:"
ls $SIGNS/*.png 2>/dev/null | wc -l
echo "Scenarios:"
ls $SCEN/*.png 2>/dev/null | wc -l
echo "Course covers:"
ls $COURS/*.png 2>/dev/null | wc -l
