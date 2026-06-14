---
Task ID: 1
Agent: Main Agent
Task: Fix hydration mismatch error + replace emojis + upgrade platform

Work Log:
- Fixed hydration mismatch in auth-context.tsx: moved localStorage reads to useEffect to ensure server/client consistency
- Fixed hydration mismatch in language-context.tsx: same pattern, initial state is 'fr', hydrate in useEffect
- Replaced all emojis across entire project with lucide-react icons:
  - mock-data.ts: flag field changed from emojis to icon identifiers ('france', 'wave', 'mountain', 'tree')
  - language-selection.tsx: replaced languageEmojis with lucide icon components (Flag, Waves, Mountain, TreePine)
  - landing-page.tsx: replaced 🇬🇳🇫🇷🌊⛰️🌳🪧📷🔊⚠ with Flag, ImageIcon, Eye, Volume2, AlertTriangle icons
  - exam-booking.tsx: replaced ⚠️ with AlertTriangle icon
  - exam-taking.tsx: replaced 🪧📷 with ImageIcon/Eye components
- Created road-signs.tsx: 14 SVG road sign components (STOP, Sens Interdit, Cédez le passage, etc.)
- Created tts-player.tsx: Reusable TTS audio player with waveform animation, compact/full modes
- Upgraded exam-taking.tsx: Road sign SVGs, mock video player, TTS integration
- Upgraded courses-page.tsx: Road sign SVGs, video player, TTS player in lessons
- Upgraded navigation.tsx: SaaS-style nav with search (Ctrl+K), notifications, user dropdown
- Upgraded admin-dashboard.tsx: Sidebar nav, sparkline KPIs, data tables, export buttons, settings
- Enhanced page.tsx: Language selection context routing (exam/practice/course/registration)
- Build verified: npx next build succeeds with zero errors

Stage Summary:
- All 6 tasks completed successfully
- No emojis remain in the project — all replaced with lucide-react icons
- Hydration error fixed
- Platform upgraded to institutional SaaS quality
- New files: road-signs.tsx, tts-player.tsx

---
Task ID: lang-removal-1
Agent: Main Agent
Task: Remove local language translations (Soussou, Poular, Malinké) to simplify and continue with other features

Work Log:
- Updated types.ts: NationalLanguage simplified to 'fr' only, translations fields commented out with TODO markers
- Updated mock-data.ts: Removed all 40 questions' translation blocks, removed course/lesson translations, kept only French in languages array, simplified helper functions
- Updated language-context.tsx: Always returns French, setLanguage is a no-op
- Updated page.tsx: Removed language-selection routing, removed LanguageSelection import, exam/practice go directly to exam-taking with 'fr'
- Updated navigation.tsx: Removed language badge, updated command palette language item
- Updated candidate-dashboard.tsx: Removed language references, disabled "Changer de langue" button, added "Bientôt disponible" notices
- Updated exam-taking.tsx: Removed language selection screen, always uses French, removed getQuestionInLanguage/useLanguage/setLanguage calls
- Updated courses-page.tsx: Removed useLanguage, simplified localized helper functions to 1-arg (no lang param), removed lang prop from CourseCard
- Updated tts-player.tsx: Simplified to French-only LANG_CODES/LANG_LABELS, removed languages import
- Updated exam-booking.tsx: Added langue: 'fr' to BookingData, fixed pattern array type
- Updated auth-modals.tsx: Added region and langueMaternelle: 'fr' to register call
- Updated language-selection.tsx: Simplified to French-only card with "Bientôt disponible" notice
- Fixed TypeScript errors: stars array typing, pattern array typing, missing properties
- Build verified: TypeScript check passes, Next.js build succeeds

Stage Summary:
- All local language translations (Soussou, Poular, Malinké) removed from the app
- App now operates exclusively in French
- Type system preserves extensibility with TODO comments for re-enabling local languages
- All components updated to remove translation logic
- "Bientôt disponible" notices placed where language features will return
- Build compiles successfully with zero src/ TypeScript errors
