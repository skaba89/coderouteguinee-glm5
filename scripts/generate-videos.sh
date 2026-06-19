#!/bin/bash
# ────────────────────────────────────────────────────────────
# Create short Ken Burns videos from scenario images
# 12 seconds each, smooth zoom-in, MP4/H264 (universal browser support)
# ────────────────────────────────────────────────────────────

set -e
ROOT=/home/z/my-project
SCEN=$ROOT/public/scenarios
VIDS=$ROOT/public/videos
mkdir -p $VIDS

# Ken Burns: zoom from 1.0 to 1.12 over 12s, slight pan upward
# Output: 1280x720 H.264 MP4, faststart for streaming
make_kb_video() {
  local img="$1"
  local out="$2"
  local label="${3:-}"
  
  if [ -f "$out" ] && [ $(stat -c%s "$out") -gt 10000 ]; then
    echo "  ✓ exists: $(basename $out) ($(stat -c%s "$out") bytes)"
    return 0
  fi
  
  echo "  ▶ creating: $(basename $out)"
  
  # Strategy: pre-scale image to 2560x1440 (2x output) so zoompan has headroom
  # Then zoompan with very slow zoom over 360 frames (12s @ 30fps)
  # d=360 means 360 output frames per input frame
  # z='min(zoom+0.0004,1.12)' grows zoom from 1.0 to 1.12 over 360 frames
  
  if [ -n "$label" ]; then
    local safe_label=$(echo "$label" | sed 's/:/\\:/g; s/'"'"'/\\'"'"'/g')
    ffmpeg -y -loop 1 -i "$img" \
      -vf "scale=2560:1440:force_original_aspect_ratio=increase,crop=2560:1440,zoompan=z='min(zoom+0.0004,1.12)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)-ih*0.05*on/360':d=360:s=1280x720:fps=30,drawtext=text='${safe_label}':fontcolor=white:fontsize=24:x=24:y=h-44:box=1:boxcolor=black@0.6:boxborderw=10:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" \
      -c:v libx264 -preset fast -crf 28 -pix_fmt yuv420p \
      -t 12 -movflags +faststart \
      "$out" 2>&1 | tail -3
  else
    ffmpeg -y -loop 1 -i "$img" \
      -vf "scale=2560:1440:force_original_aspect_ratio=increase,crop=2560:1440,zoompan=z='min(zoom+0.0004,1.12)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)-ih*0.05*on/360':d=360:s=1280x720:fps=30" \
      -c:v libx264 -preset fast -crf 28 -pix_fmt yuv420p \
      -t 12 -movflags +faststart \
      "$out" 2>&1 | tail -3
  fi
}

echo "▶ Generating Ken Burns MP4 videos..."

# Remove any failed/empty webm files
rm -f $VIDS/*.webm

make_kb_video "$SCEN/intersection-kaloum.png" "$VIDS/scenario-intersection.mp4" "Intersection de Kaloum - Conakry"
make_kb_video "$SCEN/rond-point-kankan.png" "$VIDS/scenario-rond-point.mp4" "Rond-point - Kankan"
make_kb_video "$SCEN/passage-pietons-marche.png" "$VIDS/scenario-pietons.mp4" "Passage pietons - Marche de Conakry"
make_kb_video "$SCEN/route-nationale-depassement.png" "$VIDS/scenario-depassement.mp4" "Route nationale - Depassement"
make_kb_video "$SCEN/conduite-nuit-conakry.png" "$VIDS/scenario-nuit.mp4" "Conduite de nuit - Conakry"
make_kb_video "$SCEN/route-pluie.png" "$VIDS/scenario-pluie.mp4" "Route sous la pluie"
make_kb_video "$SCEN/zone-scolaire-dixinn.png" "$VIDS/scenario-ecole.mp4" "Zone scolaire - Dixinn"
make_kb_video "$SCEN/carrefour-feux.png" "$VIDS/scenario-feux.mp4" "Carrefour a feux - Conakry"

# ── Phase 19: 5 nouveaux scénarios (qui n'étaient que des images) ──
make_kb_video "$SCEN/moto-circulation-conakry.png" "$VIDS/scenario-moto.mp4" "Motos dans le trafic - Conakry"
make_kb_video "$SCEN/animaux-nuit.png" "$VIDS/scenario-animaux.mp4" "Animaux sur route rurale de nuit"
make_kb_video "$SCEN/zone-scolaire-approche.png" "$VIDS/scenario-ecole-approche.mp4" "Approche zone scolaire"
make_kb_video "$SCEN/carrefour-giratoire-nuit.png" "$VIDS/scenario-giratoire-nuit.mp4" "Giratoire de nuit - Conakry"
make_kb_video "$SCEN/panneau-travaux.png" "$VIDS/scenario-travaux.mp4" "Chantier sur route nationale"

echo ""
echo "▶ Done. Final video inventory:"
ls -lh $VIDS/*.mp4 2>/dev/null | awk '{printf "  %-50s %s\n", $9, $5}'
