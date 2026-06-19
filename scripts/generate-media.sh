#!/bin/bash
# ────────────────────────────────────────────────────────────
# Generate Guinea-context images sequentially (avoid rate limits)
# ────────────────────────────────────────────────────────────

ROOT=/home/z/my-project
SCEN=$ROOT/public/scenarios
COURS=$ROOT/public/courses
SIZE=1344x768   # 32-aligned, valid for z-ai API

# Skip if file exists and > 50KB
gen() {
  local out="$1"; local prompt="$2"
  if [ -f "$out" ] && [ $(stat -c%s "$out" 2>/dev/null) -gt 50000 ]; then
    echo "  ✓ exists: $(basename $out)"
    return 0
  fi
  echo "  ▶ generating: $(basename $out)"
  z-ai image -s $SIZE -o "$out" -p "$prompt" 2>&1 | tail -1
  sleep 2
}

echo "▶ Scenarios (sequential)..."
gen "$SCEN/rond-point-kankan.png" "Realistic aerial view of a roundabout in Kankan, Guinea. Multiple cars circulating in the roundabout, one car waiting to enter, traffic signs visible, sandy terrain with sparse vegetation, African architecture in background, daytime, photo-realistic, high detail, driving school exam perspective"

gen "$SCEN/passage-pietons-marche.png" "Realistic driver view from a car approaching a pedestrian crossing near a busy market in Conakry Guinea. Pedestrians crossing including women with colorful fabrics and children, market stalls with fruits and vegetables, yellow taxi ahead, daytime, photo-realistic, high detail, driving school exam perspective"

gen "$SCEN/zone-scolaire-dixinn.png" "Realistic driver view approaching a school zone in Dixinn Conakry Guinea. Children with backpacks walking near the road, school building visible, yellow school zone warning sign, slow traffic, African school children in uniforms, daytime, photo-realistic, high detail, driving school exam perspective"

gen "$SCEN/route-nationale-depassement.png" "Realistic driver view on a national road in Guinea behind a slow-moving truck loaded with goods. Dashed white line on road indicating overtaking allowed, clear visibility ahead, savanna landscape with baobab trees, blue sky, photo-realistic, high detail, driving school exam perspective"

gen "$SCEN/route-pluie.png" "Realistic driver view from inside a car on a Guinea road during heavy rain. Wet asphalt reflecting lights, windshield wipers in motion, reduced visibility, puddles on road, gray sky, photo-realistic, high detail, driving school exam perspective"

gen "$SCEN/peage-rn1.png" "Realistic driver view approaching a toll booth on RN1 highway in Guinea. Multiple toll lanes with barriers, cars waiting, toll booth operators visible, signs indicating payment, African setting, daytime, photo-realistic, high detail, driving school exam perspective"

gen "$SCEN/zone-marche-pietons.png" "Realistic driver view in a busy market area in Conakry Guinea. Many pedestrians walking close to the road, women carrying goods on heads, motorcycles weaving through traffic, colorful African fabrics, no clear sidewalks, daytime, photo-realistic, high detail, driving school exam perspective"

gen "$SCEN/carrefour-feux.png" "Realistic driver view approaching a traffic light intersection in Conakry Guinea. Red traffic light visible, cars stopped at intersection, motorcycles between cars, modern buildings, road markings clear, daytime, photo-realistic, high detail, driving school exam perspective"

echo ""
echo "▶ Course covers..."
gen "$COURS/cover-signalisation.png" "Modern educational banner image for a driving course on road signs in Guinea. Multiple road signs STOP speed limit no entry yield arranged on a clean dark blue background with red yellow green Guinea flag accent stripe. Professional e-learning course cover style, flat design illustration, clear and readable, no text"

gen "$COURS/cover-priorites.png" "Modern educational banner image for a driving course on right-of-way rules in Guinea. Top-down view of an intersection with cars showing priority rules, arrows indicating traffic flow, dark blue background with red yellow green Guinea flag accent stripe. Professional e-learning course cover style, flat design illustration, no text"

gen "$COURS/cover-securite.png" "Modern educational banner image for a driving course on road safety in Guinea. Steering wheel with seat belt, safety helmet, safety triangle, first aid kit arranged on dark blue background with red yellow green Guinea flag accent stripe. Professional e-learning course cover style, flat design illustration, no text"

echo ""
echo "▶ Done. Final inventory:"
ls -lh $SCEN/*.png 2>/dev/null | awk '{printf "  %-50s %s\n", $9, $5}'
echo ""
ls -lh $COURS/*.png 2>/dev/null | awk '{printf "  %-50s %s\n", $9, $5}'
