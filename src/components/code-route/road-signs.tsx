'use client';

import React from 'react';

// ─── Color constants for Guinean road signs ────────────────────
const SIGN_COLORS = {
  red: '#CE1126',
  blue: '#003399',
  white: '#FFFFFF',
  yellow: '#FCD116',
  black: '#1A2332',
  green: '#009460',
};

// ─── Utility: sign name mapping from signImage path ────────────
export function getSignComponentFromPath(signImage: string | undefined): React.ComponentType<{ className?: string }> | null {
  if (!signImage) return null;
  const path = signImage.toLowerCase();
  if (path.includes('stop')) return StopSign;
  if (path.includes('sens-interdit')) return SensInterditSign;
  if (path.includes('cedezer') || path.includes('cede') || path.includes('cedez')) return CederLePassageSign;
  if (path.includes('priorite')) return PrioriteDroiteSign;
  if (path.includes('limitation') || path.includes('vitesse')) return VitesseLimiteeSign;
  if (path.includes('depasser')) return InterdictionDepasserSign;
  if (path.includes('passage-pieton') || path.includes('pieton')) return PassagePietonsSign;
  if (path.includes('sens-obligatoire') || path.includes('obligatoire')) return SensObligatoireSign;
  if (path.includes('virage')) return VirageDangereuxSign;
  if (path.includes('rond-point')) return RondPointSign;
  if (path.includes('interdiction-stationner') || path.includes('stationner')) return InterdictionStationnerSign;
  if (path.includes('parking')) return ParkingSign;
  if (path.includes('sens-unique')) return SensUniqueSign;
  if (path.includes('danger')) return DangerGeneralSign;
  if (path.includes('travaux')) return TravauxSign;
  if (path.includes('ecole') || path.includes('school')) return EcoleSign;
  return null;
}

// ─── 1. STOP (Octagonal red/white) ────────────────────────────
export function StopSign({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} xmlns="http://www.w3.org/2000/svg">
      <polygon
        points="60,2 84,10 110,36 118,60 110,84 84,110 60,118 36,110 10,84 2,60 10,36 36,10"
        fill={SIGN_COLORS.white}
        stroke={SIGN_COLORS.red}
        strokeWidth="8"
      />
      <polygon
        points="60,14 78,20 100,42 106,60 100,78 78,100 60,106 42,100 20,78 14,60 20,42 42,20"
        fill={SIGN_COLORS.red}
      />
      <text
        x="60"
        y="68"
        textAnchor="middle"
        fill={SIGN_COLORS.white}
        fontSize="28"
        fontWeight="900"
        fontFamily="Arial, sans-serif"
        letterSpacing="2"
      >
        STOP
      </text>
    </svg>
  );
}

// ─── 2. Sens Interdit (Red circle with white horizontal bar) ──
export function SensInterditSign({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="54" fill={SIGN_COLORS.white} stroke={SIGN_COLORS.red} strokeWidth="8" />
      <circle cx="60" cy="60" r="46" fill={SIGN_COLORS.red} />
      <rect x="22" y="50" width="76" height="16" rx="3" fill={SIGN_COLORS.white} />
    </svg>
  );
}

// ─── 3. Cédez le passage (Inverted red/white triangle) ────────
export function CederLePassageSign({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} xmlns="http://www.w3.org/2000/svg">
      <polygon
        points="60,8 114,104 6,104"
        fill={SIGN_COLORS.white}
        stroke={SIGN_COLORS.red}
        strokeWidth="8"
        strokeLinejoin="round"
      />
      <polygon
        points="60,24 102,96 18,96"
        fill={SIGN_COLORS.white}
        stroke={SIGN_COLORS.red}
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <text
        x="60"
        y="88"
        textAnchor="middle"
        fill={SIGN_COLORS.red}
        fontSize="12"
        fontWeight="800"
        fontFamily="Arial, sans-serif"
      >
        CEDEZ
      </text>
      <text
        x="60"
        y="100"
        textAnchor="middle"
        fill={SIGN_COLORS.red}
        fontSize="9"
        fontWeight="700"
        fontFamily="Arial, sans-serif"
      >
        LE PASSAGE
      </text>
    </svg>
  );
}

// ─── 4. Priorité à droite (Yellow diamond) ─────────────────────
export function PrioriteDroiteSign({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} xmlns="http://www.w3.org/2000/svg">
      <polygon
        points="60,4 116,60 60,116 4,60"
        fill={SIGN_COLORS.yellow}
        stroke={SIGN_COLORS.black}
        strokeWidth="3"
      />
      <polygon
        points="60,16 104,60 60,104 16,60"
        fill={SIGN_COLORS.yellow}
        stroke={SIGN_COLORS.black}
        strokeWidth="1.5"
      />
      <text
        x="60"
        y="56"
        textAnchor="middle"
        fill={SIGN_COLORS.black}
        fontSize="9"
        fontWeight="800"
        fontFamily="Arial, sans-serif"
      >
        PRIORITÉ
      </text>
      <text
        x="60"
        y="70"
        textAnchor="middle"
        fill={SIGN_COLORS.black}
        fontSize="9"
        fontWeight="800"
        fontFamily="Arial, sans-serif"
      >
        À DROITE
      </text>
    </svg>
  );
}

// ─── 5. Danger général (Red triangle with exclamation) ────────
export function DangerGeneralSign({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} xmlns="http://www.w3.org/2000/svg">
      <polygon
        points="60,6 114,102 6,102"
        fill={SIGN_COLORS.white}
        stroke={SIGN_COLORS.red}
        strokeWidth="8"
        strokeLinejoin="round"
      />
      <polygon
        points="60,22 102,94 18,94"
        fill={SIGN_COLORS.white}
      />
      <text
        x="60"
        y="78"
        textAnchor="middle"
        fill={SIGN_COLORS.black}
        fontSize="42"
        fontWeight="900"
        fontFamily="Arial, sans-serif"
      >
        !
      </text>
    </svg>
  );
}

// ─── 6. Virage dangereux (Red triangle with curved arrow) ─────
export function VirageDangereuxSign({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} xmlns="http://www.w3.org/2000/svg">
      <polygon
        points="60,6 114,102 6,102"
        fill={SIGN_COLORS.white}
        stroke={SIGN_COLORS.red}
        strokeWidth="8"
        strokeLinejoin="round"
      />
      <polygon
        points="60,22 102,94 18,94"
        fill={SIGN_COLORS.white}
      />
      {/* Curved arrow pointing right */}
      <path
        d="M 38,72 Q 38,48 60,48 Q 82,48 82,68"
        fill="none"
        stroke={SIGN_COLORS.black}
        strokeWidth="5"
        strokeLinecap="round"
      />
      <polygon
        points="82,60 92,70 82,72"
        fill={SIGN_COLORS.black}
      />
    </svg>
  );
}

// ─── 7. Sens unique (Blue rectangle with white arrow) ─────────
export function SensUniqueSign({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="24" width="108" height="72" rx="4" fill={SIGN_COLORS.blue} />
      <rect x="6" y="24" width="108" height="72" rx="4" fill="none" stroke={SIGN_COLORS.white} strokeWidth="3" />
      {/* Arrow pointing up */}
      <line x1="60" y1="82" x2="60" y2="42" stroke={SIGN_COLORS.white} strokeWidth="6" strokeLinecap="round" />
      <polygon points="44,48 60,30 76,48" fill={SIGN_COLORS.white} />
    </svg>
  );
}

// ─── 8. Parking (Blue square with white P) ─────────────────────
export function ParkingSign({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="6" width="108" height="108" rx="4" fill={SIGN_COLORS.blue} />
      <rect x="6" y="6" width="108" height="108" rx="4" fill="none" stroke={SIGN_COLORS.white} strokeWidth="3" />
      <text
        x="60"
        y="82"
        textAnchor="middle"
        fill={SIGN_COLORS.white}
        fontSize="60"
        fontWeight="900"
        fontFamily="Arial, sans-serif"
      >
        P
      </text>
    </svg>
  );
}

// ─── 9. Interdiction de stationner (Red circle with diagonal through E) ──
export function InterdictionStationnerSign({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="54" fill={SIGN_COLORS.white} stroke={SIGN_COLORS.red} strokeWidth="8" />
      <circle cx="60" cy="60" r="46" fill={SIGN_COLORS.white} stroke={SIGN_COLORS.red} strokeWidth="3" />
      <text
        x="60"
        y="72"
        textAnchor="middle"
        fill={SIGN_COLORS.black}
        fontSize="40"
        fontWeight="900"
        fontFamily="Arial, sans-serif"
      >
        E
      </text>
      {/* Diagonal red line */}
      <line x1="24" y1="96" x2="96" y2="24" stroke={SIGN_COLORS.red} strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}

// ─── 10. Vitesse limitée (Red circle with speed number) ────────
export function VitesseLimiteeSign({ className, speed }: { className?: string; speed?: number }) {
  const displaySpeed = speed || 50;
  return (
    <svg viewBox="0 0 120 120" className={className} xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="54" fill={SIGN_COLORS.white} stroke={SIGN_COLORS.red} strokeWidth="8" />
      <circle cx="60" cy="60" r="46" fill={SIGN_COLORS.white} />
      <text
        x="60"
        y={displaySpeed >= 100 ? 70 : 68}
        textAnchor="middle"
        fill={SIGN_COLORS.black}
        fontSize={displaySpeed >= 100 ? 28 : 36}
        fontWeight="900"
        fontFamily="Arial, sans-serif"
      >
        {displaySpeed}
      </text>
    </svg>
  );
}

// ─── 11. Passage piétons (Blue sign with walking person) ───────
export function PassagePietonsSign({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Blue square background */}
      <rect x="6" y="6" width="108" height="108" rx="4" fill={SIGN_COLORS.blue} />
      <rect x="6" y="6" width="108" height="108" rx="4" fill="none" stroke={SIGN_COLORS.white} strokeWidth="3" />
      {/* Stylized walking person */}
      {/* Head */}
      <circle cx="56" cy="32" r="8" fill={SIGN_COLORS.white} />
      {/* Body */}
      <line x1="56" y1="40" x2="56" y2="68" stroke={SIGN_COLORS.white} strokeWidth="5" strokeLinecap="round" />
      {/* Arms */}
      <line x1="40" y1="50" x2="72" y2="48" stroke={SIGN_COLORS.white} strokeWidth="4" strokeLinecap="round" />
      {/* Left leg */}
      <line x1="56" y1="68" x2="42" y2="92" stroke={SIGN_COLORS.white} strokeWidth="4" strokeLinecap="round" />
      {/* Right leg */}
      <line x1="56" y1="68" x2="72" y2="92" stroke={SIGN_COLORS.white} strokeWidth="4" strokeLinecap="round" />
      {/* Zebra crossing lines below */}
      <rect x="30" y="96" width="8" height="14" rx="1" fill={SIGN_COLORS.white} />
      <rect x="44" y="96" width="8" height="14" rx="1" fill={SIGN_COLORS.white} />
      <rect x="58" y="96" width="8" height="14" rx="1" fill={SIGN_COLORS.white} />
      <rect x="72" y="96" width="8" height="14" rx="1" fill={SIGN_COLORS.white} />
    </svg>
  );
}

// ─── 12. Rond-point (Blue circle with rotating arrows) ────────
export function RondPointSign({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="54" fill={SIGN_COLORS.blue} />
      <circle cx="60" cy="60" r="54" fill="none" stroke={SIGN_COLORS.white} strokeWidth="3" />
      {/* Three rotating arrows */}
      {/* Arrow 1 - top */}
      <path
        d="M 60,24 A 36,36 0 0,1 92,48"
        fill="none"
        stroke={SIGN_COLORS.white}
        strokeWidth="5"
        strokeLinecap="round"
      />
      <polygon points="90,40 96,52 84,50" fill={SIGN_COLORS.white} />
      {/* Arrow 2 - bottom right */}
      <path
        d="M 88,68 A 36,36 0 0,1 44,90"
        fill="none"
        stroke={SIGN_COLORS.white}
        strokeWidth="5"
        strokeLinecap="round"
      />
      <polygon points="50,92 38,88 46,78" fill={SIGN_COLORS.white} />
      {/* Arrow 3 - bottom left */}
      <path
        d="M 36,82 A 36,36 0 0,1 36,38"
        fill="none"
        stroke={SIGN_COLORS.white}
        strokeWidth="5"
        strokeLinecap="round"
      />
      <polygon points="28,44 32,32 42,40" fill={SIGN_COLORS.white} />
    </svg>
  );
}

// ─── 13. Travaux (Red triangle with person digging) ────────────
export function TravauxSign({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} xmlns="http://www.w3.org/2000/svg">
      <polygon
        points="60,6 114,102 6,102"
        fill={SIGN_COLORS.white}
        stroke={SIGN_COLORS.red}
        strokeWidth="8"
        strokeLinejoin="round"
      />
      <polygon
        points="60,22 102,94 18,94"
        fill={SIGN_COLORS.white}
      />
      {/* Person with shovel */}
      {/* Head */}
      <circle cx="50" cy="48" r="6" fill={SIGN_COLORS.black} />
      {/* Body */}
      <line x1="50" y1="54" x2="50" y2="74" stroke={SIGN_COLORS.black} strokeWidth="4" strokeLinecap="round" />
      {/* Legs */}
      <line x1="50" y1="74" x2="40" y2="90" stroke={SIGN_COLORS.black} strokeWidth="3" strokeLinecap="round" />
      <line x1="50" y1="74" x2="58" y2="90" stroke={SIGN_COLORS.black} strokeWidth="3" strokeLinecap="round" />
      {/* Arms holding shovel */}
      <line x1="50" y1="60" x2="68" y2="50" stroke={SIGN_COLORS.black} strokeWidth="3" strokeLinecap="round" />
      <line x1="50" y1="64" x2="66" y2="58" stroke={SIGN_COLORS.black} strokeWidth="3" strokeLinecap="round" />
      {/* Shovel */}
      <line x1="68" y1="50" x2="80" y2="82" stroke={SIGN_COLORS.black} strokeWidth="3" strokeLinecap="round" />
      {/* Shovel head */}
      <path d="M 74,80 Q 80,76 86,82 Q 84,90 76,88 Z" fill={SIGN_COLORS.black} />
      {/* Dirt pile */}
      <ellipse cx="84" cy="92" rx="12" ry="4" fill={SIGN_COLORS.black} opacity="0.4" />
    </svg>
  );
}

// ─── 14. École (Red triangle with children) ────────────────────
export function EcoleSign({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} xmlns="http://www.w3.org/2000/svg">
      <polygon
        points="60,6 114,102 6,102"
        fill={SIGN_COLORS.white}
        stroke={SIGN_COLORS.red}
        strokeWidth="8"
        strokeLinejoin="round"
      />
      <polygon
        points="60,22 102,94 18,94"
        fill={SIGN_COLORS.white}
      />
      {/* Child 1 (taller) */}
      <circle cx="44" cy="48" r="5" fill={SIGN_COLORS.black} />
      <line x1="44" y1="53" x2="44" y2="72" stroke={SIGN_COLORS.black} strokeWidth="3" strokeLinecap="round" />
      <line x1="44" y1="72" x2="36" y2="88" stroke={SIGN_COLORS.black} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="44" y1="72" x2="52" y2="88" stroke={SIGN_COLORS.black} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="44" y1="60" x2="54" y2="56" stroke={SIGN_COLORS.black} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="44" y1="60" x2="34" y2="58" stroke={SIGN_COLORS.black} strokeWidth="2.5" strokeLinecap="round" />
      {/* Child 2 (shorter, with school bag) */}
      <circle cx="74" cy="52" r="5" fill={SIGN_COLORS.black} />
      <line x1="74" y1="57" x2="74" y2="74" stroke={SIGN_COLORS.black} strokeWidth="3" strokeLinecap="round" />
      <line x1="74" y1="74" x2="66" y2="88" stroke={SIGN_COLORS.black} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="74" y1="74" x2="82" y2="88" stroke={SIGN_COLORS.black} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="74" y1="62" x2="84" y2="60" stroke={SIGN_COLORS.black} strokeWidth="2.5" strokeLinecap="round" />
      {/* School bag */}
      <rect x="80" y="58" width="8" height="10" rx="2" fill={SIGN_COLORS.black} />
    </svg>
  );
}

// ─── Interdiction de dépasser (Red circle with cars) ───────────
export function InterdictionDepasserSign({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="54" fill={SIGN_COLORS.white} stroke={SIGN_COLORS.red} strokeWidth="8" />
      <circle cx="60" cy="60" r="46" fill={SIGN_COLORS.white} />
      {/* Car 1 (left, red) */}
      <rect x="24" y="48" width="24" height="14" rx="3" fill={SIGN_COLORS.red} />
      <rect x="28" y="44" width="16" height="8" rx="2" fill={SIGN_COLORS.red} />
      {/* Car 2 (right, black, being overtaken) */}
      <rect x="66" y="52" width="24" height="14" rx="3" fill={SIGN_COLORS.black} />
      <rect x="70" y="48" width="16" height="8" rx="2" fill={SIGN_COLORS.black} />
      {/* Red lines through */}
      <line x1="28" y1="84" x2="92" y2="36" stroke={SIGN_COLORS.red} strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

// ─── Sens obligatoire (Blue circle with white arrow) ──────────
export function SensObligatoireSign({ className, direction }: { className?: string; direction?: 'right' | 'left' | 'straight' }) {
  const dir = direction || 'right';
  return (
    <svg viewBox="0 0 120 120" className={className} xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="54" fill={SIGN_COLORS.blue} />
      <circle cx="60" cy="60" r="54" fill="none" stroke={SIGN_COLORS.white} strokeWidth="3" />
      {dir === 'right' && (
        <>
          <line x1="24" y1="60" x2="80" y2="60" stroke={SIGN_COLORS.white} strokeWidth="6" strokeLinecap="round" />
          <polygon points="76,44 96,60 76,76" fill={SIGN_COLORS.white} />
        </>
      )}
      {dir === 'left' && (
        <>
          <line x1="96" y1="60" x2="40" y2="60" stroke={SIGN_COLORS.white} strokeWidth="6" strokeLinecap="round" />
          <polygon points="44,44 24,60 44,76" fill={SIGN_COLORS.white} />
        </>
      )}
      {dir === 'straight' && (
        <>
          <line x1="60" y1="90" x2="60" y2="36" stroke={SIGN_COLORS.white} strokeWidth="6" strokeLinecap="round" />
          <polygon points="44,40 60,22 76,40" fill={SIGN_COLORS.white} />
        </>
      )}
    </svg>
  );
}

// ─── Road Sign Display Component ──────────────────────────────
// Renders the appropriate SVG sign based on signImage path
export function RoadSignDisplay({
  signImage,
  className,
  size = 'md',
}: {
  signImage: string | undefined;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  const sizeClasses: Record<string, string> = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
    xl: 'w-48 h-48',
  };

  // ──── Priority 1: real PNG/JPG image file ──────────────
  // If signImage points to an actual image asset (/signs/*.png, /scenarios/*.png, /courses/*.png),
  // render the real photo instead of the generic SVG. The PNGs were generated with z-ai image
  // and reflect real-world Guinean road signs with much more realism than the SVG illustrations.
  if (signImage && /\.(png|jpe?g|webp|svg)$/i.test(signImage) && /^\/(signs|scenarios|courses)\//.test(signImage)) {
    // Determine human-readable alt text from filename for accessibility
    const alt = signImage
      .split('/')
      .pop()
      ?.replace(/\.(png|jpe?g|webp|svg)$/i, '')
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase()) || 'Panneau de signalisation';

    return (
      <img
        src={signImage}
        alt={alt}
        className={`${sizeClasses[size]} ${className || ''} object-contain drop-shadow-md`}
        loading="lazy"
      />
    );
  }

  // ──── Priority 2: SVG fallback via path-based key mapping ────
  const signKey = getSignKey(signImage);

  if (!signKey) {
    // Fallback: show a generic sign icon
    return (
      <div className={`${sizeClasses[size]} ${className || ''} rounded-xl bg-gray-100 flex items-center justify-center border-2 border-gray-200`}>
        <svg viewBox="0 0 24 24" className="w-1/2 h-1/2 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} ${className || ''}`}>
      <RoadSignByKey signKey={signKey} />
    </div>
  );
}

// Returns a string key instead of a component to avoid creating components during render
function getSignKey(signImage: string | undefined): string | null {
  if (!signImage) return null;
  const path = signImage.toLowerCase();
  if (path.includes('stop')) return 'stop';
  if (path.includes('sens-interdit')) return 'sens-interdit';
  if (path.includes('cedezer') || path.includes('cede') || path.includes('cedez')) return 'ceder-passage';
  if (path.includes('priorite')) return 'priorite-droite';
  if (path.includes('limitation') || path.includes('vitesse')) return 'vitesse-limitee';
  if (path.includes('depasser')) return 'interdiction-depasser';
  if (path.includes('passage-pieton') || path.includes('pieton')) return 'passage-pietons';
  if (path.includes('sens-obligatoire') || path.includes('obligatoire')) return 'sens-obligatoire';
  if (path.includes('virage')) return 'virage-dangereux';
  if (path.includes('rond-point')) return 'rond-point';
  if (path.includes('interdiction-stationner') || path.includes('stationner')) return 'interdiction-stationner';
  if (path.includes('parking')) return 'parking';
  if (path.includes('sens-unique')) return 'sens-unique';
  if (path.includes('danger')) return 'danger-general';
  if (path.includes('travaux')) return 'travaux';
  if (path.includes('ecole') || path.includes('school')) return 'ecole';
  return null;
}

// Renders the sign based on key — defined outside render to avoid lint issues
function RoadSignByKey({ signKey }: { signKey: string }) {
  const cls = "w-full h-full drop-shadow-md";
  switch (signKey) {
    case 'stop': return <StopSign className={cls} />;
    case 'sens-interdit': return <SensInterditSign className={cls} />;
    case 'ceder-passage': return <CederLePassageSign className={cls} />;
    case 'priorite-droite': return <PrioriteDroiteSign className={cls} />;
    case 'vitesse-limitee': return <VitesseLimiteeSign className={cls} />;
    case 'interdiction-depasser': return <InterdictionDepasserSign className={cls} />;
    case 'passage-pietons': return <PassagePietonsSign className={cls} />;
    case 'sens-obligatoire': return <SensObligatoireSign className={cls} />;
    case 'virage-dangereux': return <VirageDangereuxSign className={cls} />;
    case 'rond-point': return <RondPointSign className={cls} />;
    case 'interdiction-stationner': return <InterdictionStationnerSign className={cls} />;
    case 'parking': return <ParkingSign className={cls} />;
    case 'sens-unique': return <SensUniqueSign className={cls} />;
    case 'danger-general': return <DangerGeneralSign className={cls} />;
    case 'travaux': return <TravauxSign className={cls} />;
    case 'ecole': return <EcoleSign className={cls} />;
    default: return null;
  }
}
