'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Car,
  UserPlus,
  CalendarCheck,
  FileCheck,
  Award,
  Users,
  Building2,
  ThumbsUp,
  ChevronRight,
  Shield,
  Clock,
  Smartphone,
  Globe,
  Volume2,
  Eye,
  BookOpen,
  CheckCircle,
  BarChart3,
  ArrowRight,
  Play,
  Image as ImageIcon,
  AlertTriangle,
  Flag,
  Waves,
  Mountain,
  TreePine,
  Languages,
  LucideIcon,
} from 'lucide-react';

interface LandingPageProps {
  onLogin: () => void;
  onRegister: () => void;
}

/* ───────────────────── Animated Counter ───────────────────── */
function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          let start = 0;
          const duration = 2000;
          const increment = target / (duration / 16);
          const timer = setInterval(() => {
            start += increment;
            if (start >= target) {
              setCount(target);
              clearInterval(timer);
            } else {
              setCount(Math.floor(start));
            }
          }, 16);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, hasAnimated]);

  return (
    <span ref={ref}>
      {count.toLocaleString('fr-FR')}{suffix}
    </span>
  );
}

/* ───────────────────── Waveform Icon ───────────────────── */
function WaveformIcon() {
  return (
    <svg width="32" height="16" viewBox="0 0 32 16" fill="none" className="opacity-40">
      <rect x="0" y="6" width="2" height="4" rx="1" fill="currentColor" />
      <rect x="4" y="4" width="2" height="8" rx="1" fill="currentColor" />
      <rect x="8" y="2" width="2" height="12" rx="1" fill="currentColor" />
      <rect x="12" y="5" width="2" height="6" rx="1" fill="currentColor" />
      <rect x="16" y="3" width="2" height="10" rx="1" fill="currentColor" />
      <rect x="20" y="4" width="2" height="8" rx="1" fill="currentColor" />
      <rect x="24" y="6" width="2" height="4" rx="1" fill="currentColor" />
      <rect x="28" y="5" width="2" height="6" rx="1" fill="currentColor" />
    </svg>
  );
}

/* ───────────────────── Main Component ───────────────────── */
export default function LandingPage({ onLogin, onRegister }: LandingPageProps) {

  /* ── 5 Steps ── */
  const steps = [
    { icon: UserPlus, title: 'Inscription', desc: 'Créez votre compte avec votre pièce d\'identité et commencez votre préparation', color: '#009460' },
    { icon: CalendarCheck, title: 'Réservation', desc: 'Choisissez votre centre, date et créneau horaire. Paiement Mobile Money sécurisé', color: '#FCD116' },
    { icon: BookOpen, title: 'Préparation', desc: 'Étudiez avec des panneaux visuels, vidéos et cours avec lecture audio', color: '#0EA5E9' },
    { icon: FileCheck, title: 'Examen', desc: 'Passez votre examen en toute sécurité avec surveillance anti-fraude biométrique', color: '#CE1126' },
    { icon: Award, title: 'Permis', desc: 'Recevez votre certificat avec QR code vérifiable, transmis directement à l\'administration', color: '#7C3AED' },
  ];

  /* ── Nouveautes ── */
  const nouveautes = [
    {
      icon: ImageIcon,
      title: 'Panneaux et scénarios visuels',
      desc: 'Chaque question affiche le panneau routier réel ou une photo de situation de conduite pour une compréhension immédiate, même sans savoir lire',
      accent: '#1A2332'
    },
    {
      icon: Volume2,
      title: 'Lecture audio en français',
      desc: 'Écoutez les questions lues à voix haute. Idéal pour une meilleure compréhension, même sans savoir lire',
      accent: '#009460'
    },
    {
      icon: BookOpen,
      title: 'Formation interactive',
      desc: 'Des cours structurés par catégorie avec exercices pratiques, vidéos explicatives et suivi de progression',
      accent: '#E97316'
    }
  ];

  /* ── Languages ── */
  const languages: { icon: LucideIcon; name: string; native: string; regions: string; population: string; accentColor: string }[] = [
    {
      icon: Flag,
      name: 'Français',
      native: 'Langue officielle',
      regions: 'Toutes les régions',
      population: '',
      accentColor: '#3b5998'
    },
  ];

  /* ── Comparison data ── */
  const comparisons = [
    { feature: 'Lecture audio', us: true, other: false },
    { feature: 'Panneaux visuels', us: true, other: 'partial' },
    { feature: 'Scénarios photo', us: true, other: false },
    { feature: 'Anti-fraude biométrique', us: true, other: 'partial' },
    { feature: 'Certification QR code', us: true, other: false }
  ];

  /* ── Stats ── */
  const stats = [
    { icon: Users, value: 50000, suffix: '+', label: 'Candidats inscrits', color: '#FCD116' },
    { icon: Building2, value: 15, suffix: '+', label: 'Centres agréés', color: '#FCD116' },
    { icon: Globe, value: 1, suffix: '', label: 'Langue disponible', color: '#FCD116' },
    { icon: ThumbsUp, value: 98, suffix: '%', label: 'Taux de satisfaction', color: '#FCD116' }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* ═══════════════════════════════════════════════════════
          1. HERO SECTION
          ═══════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        {/* Dark gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1A2332] via-[#0d1a2d] to-[#1A2332]" />

        {/* Guinea flag stripe at very top */}
        <div className="absolute top-0 left-0 w-full h-2 flex z-10">
          <div className="flex-1" style={{ backgroundColor: '#CE1126' }} />
          <div className="flex-1" style={{ backgroundColor: '#FCD116' }} />
          <div className="flex-1" style={{ backgroundColor: '#009460' }} />
        </div>

        {/* Decorative geometric patterns */}
        <div className="absolute top-20 right-10 w-80 h-80 rounded-full opacity-[0.06]" style={{ backgroundColor: '#009460' }} />
        <div className="absolute bottom-10 left-10 w-64 h-64 rounded-full opacity-[0.06]" style={{ backgroundColor: '#FCD116' }} />
        <div className="absolute top-40 left-1/4 w-96 h-96 rounded-full opacity-[0.03]" style={{ backgroundColor: '#CE1126' }} />

        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />

        {/* Floating sign icons */}
        <div className="absolute top-32 left-[8%] opacity-10 text-white animate-pulse" style={{ animationDuration: '4s' }}>
          <Shield className="w-10 h-10" />
        </div>
        <div className="absolute top-48 right-[12%] opacity-10 text-white animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }}>
          <Car className="w-12 h-12" />
        </div>
        <div className="absolute bottom-32 left-[15%] opacity-10 text-white animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }}>
          <Volume2 className="w-8 h-8" />
        </div>
        <div className="absolute bottom-24 right-[8%] opacity-10 text-white animate-pulse" style={{ animationDuration: '4.5s', animationDelay: '0.5s' }}>
          <Eye className="w-10 h-10" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20 sm:pt-20 sm:pb-28 lg:pt-28 lg:pb-36">
          <div className="text-center">
            {/* Republic mention badge */}
            <div className="inline-flex items-center gap-2 mb-8 px-5 py-2.5 rounded-full bg-white/[0.08] backdrop-blur-sm border border-white/[0.1]">
              <Flag className="w-4 h-4" style={{ color: '#FCD116' }} />
              <span className="font-medium text-white/90 text-sm">République de Guinée</span>
              <span className="text-white/30">|</span>
              <span className="text-white/70 text-sm">Ministère des Transports</span>
            </div>

            {/* Title */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white mb-6 tracking-tight">
              CodeRoute{' '}
              <span className="relative inline-block">
                <span style={{ color: '#FCD116' }}>Guinée</span>
                <span className="absolute -bottom-1 left-0 w-full h-1 rounded-full" style={{ backgroundColor: '#FCD116', opacity: 0.4 }} />
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto mb-3 leading-relaxed">
              Plateforme nationale digitale pour l&apos;examen théorique du permis de conduire
            </p>

            {/* New tagline */}
            <p className="text-base sm:text-lg font-medium max-w-xl mx-auto mb-8" style={{ color: '#FCD116' }}>
              Avec panneaux, vidéos et lecture audio
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap justify-center gap-3 mb-10">
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-white/[0.07] border border-white/[0.12] text-white/90 backdrop-blur-sm">
                <ImageIcon className="w-4 h-4" /> Panneaux routiers
              </span>
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-white/[0.07] border border-white/[0.12] text-white/90 backdrop-blur-sm">
                <Eye className="w-4 h-4" /> Scénarios visuels
              </span>
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-white/[0.07] border border-white/[0.12] text-white/90 backdrop-blur-sm">
                <Volume2 className="w-4 h-4" /> Lecture audio
              </span>
            </div>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="text-white font-semibold px-8 py-6 text-lg rounded-xl shadow-lg shadow-[#009460]/30 hover:shadow-xl hover:shadow-[#009460]/40 transition-all duration-300 hover:scale-[1.02]"
                style={{ backgroundColor: '#009460' }}
                onClick={onRegister}
              >
                <UserPlus className="w-5 h-5 mr-2" />
                S&apos;inscrire
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="font-semibold px-8 py-6 text-lg border-white/25 text-white hover:bg-white/10 rounded-xl transition-all duration-300 hover:scale-[1.02]"
                onClick={onLogin}
              >
                Se connecter
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          2. COMMENT ÇA MARCHE (5 steps)
          ═══════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: '#1A2332' }}>
              Comment ça marche
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              Un processus simple et sécurisé en 5 étapes
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 relative">
            {steps.map((step, index) => (
              <React.Fragment key={index}>
                <Card className="relative border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-6 text-center">
                    {/* Step number badge */}
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md" style={{ backgroundColor: step.color }}>
                      {index + 1}
                    </div>
                    <div className="w-14 h-14 rounded-xl mx-auto mt-4 mb-4 flex items-center justify-center" style={{ backgroundColor: `${step.color}15` }}>
                      <step.icon className="w-7 h-7" style={{ color: step.color }} />
                    </div>
                    <h3 className="font-bold text-lg mb-2" style={{ color: '#1A2332' }}>{step.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
                  </CardContent>
                </Card>
                {/* Arrow between cards */}
                {index < steps.length - 1 && (
                  <ChevronRight className="hidden lg:block absolute top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 z-10" style={{ left: `calc(${((index) * 20) + 19}% )` }} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          3. CE QUI NOUS DISTINGUE (Nouveautés)
          ═══════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold uppercase tracking-widest mb-2" style={{ color: '#CE1126' }}>Nouveautés</p>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: '#1A2332' }}>
              Ce qui nous distingue
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              Des innovations uniques pour un examen accessible à tous les Guinéens
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {nouveautes.map((item, index) => (
              <Card key={index} className="group border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                <CardContent className="p-8">
                  {/* Accent top border */}
                  <div className="h-1 w-16 rounded-full mb-6 transition-all duration-300 group-hover:w-24" style={{ backgroundColor: item.accent }} />
                  <div className="w-14 h-14 rounded-2xl mb-5 flex items-center justify-center" style={{ backgroundColor: `${item.accent}12` }}>
                    <item.icon className="w-7 h-7" style={{ color: item.accent }} />
                  </div>
                  <h3 className="font-bold text-xl mb-3" style={{ color: '#1A2332' }}>{item.title}</h3>
                  <p className="text-gray-500 leading-relaxed">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          4. ACCESSIBILITÉ — Examen en français avec lecture audio
          ═══════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-24" style={{ backgroundColor: '#1A2332' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold uppercase tracking-widest mb-2" style={{ color: '#FCD116' }}>Accessibilité</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Un examen accessible à tous
            </h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              Passez votre examen en français avec lecture audio pour une meilleure compréhension
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* French language card */}
            {languages.map((lang, index) => {
              const IconComp = lang.icon;
              return (
                <Card key={index} className="group border-0 bg-white/[0.06] backdrop-blur-sm border border-white/[0.08] hover:bg-white/[0.10] transition-all duration-300 hover:-translate-y-1" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                  <CardContent className="p-6 text-center">
                    <div className="w-14 h-14 rounded-xl mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: `${lang.accentColor}20` }}>
                      <IconComp className="w-7 h-7" style={{ color: lang.accentColor }} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">{lang.name}</h3>
                    <p className="text-sm font-medium mb-2" style={{ color: '#FCD116' }}>{lang.native}</p>
                    <p className="text-gray-400 text-sm mb-3">{lang.regions}</p>
                    {/* Waveform audio indicator */}
                    <div className="flex items-center justify-center gap-2 text-white/40">
                      <Volume2 className="w-4 h-4" />
                      <WaveformIcon />
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* Coming soon cards for local languages */}
            <Card className="group border-0 bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] opacity-60" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 rounded-xl mx-auto mb-3 flex items-center justify-center bg-white/[0.06]">
                  <Languages className="w-7 h-7 text-white/40" />
                </div>
                <h3 className="text-lg font-bold text-white/50 mb-1">Soussou, Poular, Malinké</h3>
                <p className="text-sm font-medium mb-2 text-white/30">Bientôt disponible</p>
                <p className="text-gray-500 text-xs">Langues nationales</p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-10">
            <Button
              size="lg"
              className="font-semibold px-8 py-5 rounded-xl text-[#1A2332] shadow-lg transition-all duration-300 hover:scale-[1.02]"
              style={{ backgroundColor: '#FCD116' }}
              onClick={onRegister}
            >
              <Globe className="w-5 h-5 mr-2" />
              S&apos;inscrire maintenant
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          5. STATISTICS
          ═══════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 bg-gradient-to-br from-[#1A2332] via-[#1e2d42] to-[#1A2332]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <div key={index} className="group">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/[0.08] group-hover:bg-white/[0.12] transition-colors">
                    <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                  </div>
                </div>
                <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </div>
                <p className="text-gray-400 text-sm sm:text-base">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          6. COMPARAISON INTERNATIONALE
          ═══════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold uppercase tracking-widest mb-2" style={{ color: '#009460' }}>Benchmark</p>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: '#1A2332' }}>
              En avance sur les standards mondiaux
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              CodeRoute Guinée dépasse les plateformes internationales
            </p>
          </div>

          <Card className="border-0 shadow-xl overflow-hidden">
            <CardContent className="p-0">
              {/* Table header */}
              <div className="grid grid-cols-3 bg-gray-50 border-b border-gray-100">
                <div className="p-4 sm:p-5 font-semibold text-gray-600 text-sm sm:text-base">Fonctionnalité</div>
                <div className="p-4 sm:p-5 font-semibold text-center text-sm sm:text-base" style={{ color: '#009460' }}>
                  <div className="flex items-center justify-center gap-1.5">
                    <Car className="w-4 h-4" />
                    CodeRoute Guinée
                  </div>
                </div>
                <div className="p-4 sm:p-5 font-semibold text-center text-gray-400 text-sm sm:text-base">Autres plateformes</div>
              </div>

              {/* Table rows */}
              {comparisons.map((row, index) => (
                <div
                  key={index}
                  className={`grid grid-cols-3 items-center ${index !== comparisons.length - 1 ? 'border-b border-gray-50' : ''} hover:bg-gray-50/50 transition-colors`}
                >
                  <div className="p-4 sm:p-5 text-sm sm:text-base font-medium" style={{ color: '#1A2332' }}>
                    {row.feature}
                  </div>
                  <div className="p-4 sm:p-5 text-center">
                    {row.us === true ? (
                      <CheckCircle className="w-6 h-6 mx-auto" style={{ color: '#009460' }} />
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </div>
                  <div className="p-4 sm:p-5 text-center">
                    {row.other === true ? (
                      <CheckCircle className="w-6 h-6 mx-auto text-green-500" />
                    ) : row.other === 'partial' ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-500 mx-auto">
                        <AlertTriangle className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-50 text-red-400 text-lg mx-auto">×</span>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          7. CTA SECTION
          ═══════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 relative overflow-hidden" style={{ backgroundColor: '#009460' }}>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 bg-white -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10 bg-white translate-y-1/2 -translate-x-1/2" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Car className="w-12 h-12 text-white/60 mx-auto mb-6" />
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Prêt à passer votre code ?
          </h2>
          <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
            Inscrivez-vous et préparez votre examen du code
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="font-semibold px-8 py-6 text-lg rounded-xl shadow-lg transition-all duration-300 hover:scale-[1.02]"
              style={{ backgroundColor: '#FCD116', color: '#1A2332' }}
              onClick={onRegister}
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Créer un compte
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="font-semibold px-8 py-6 text-lg border-white/40 text-white hover:bg-white/10 rounded-xl transition-all duration-300 hover:scale-[1.02]"
              onClick={onLogin}
            >
              J&apos;ai déjà un compte
            </Button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          8. FOOTER
          ═══════════════════════════════════════════════════════ */}
      <footer className="py-10" style={{ backgroundColor: '#1A2332' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#009460' }}>
                <Car className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-white text-lg">
                CodeRoute <span style={{ color: '#FCD116' }}>Guinée</span>
              </span>
            </div>

            {/* Links */}
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <a href="#" className="hover:text-white transition-colors">À propos</a>
              <a href="#" className="hover:text-white transition-colors">Centres</a>
              <a href="#" className="hover:text-white transition-colors">Aide</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>

            {/* Republic branding */}
            <div className="text-center sm:text-right">
              <div className="flex items-center gap-1.5 justify-center sm:justify-end">
                <Flag className="w-4 h-4" style={{ color: '#FCD116' }} />
                <span className="text-gray-400 text-sm">République de Guinée — Ministère des Transports</span>
              </div>
              <p className="text-gray-500 text-xs mt-1">© 2026 CodeRoute Guinée. Tous droits réservés.</p>
            </div>
          </div>

          {/* Flag stripe at bottom */}
          <div className="mt-8 flex gap-0.5 rounded-full overflow-hidden">
            <div className="h-1.5 flex-1" style={{ backgroundColor: '#CE1126' }} />
            <div className="h-1.5 flex-1" style={{ backgroundColor: '#FCD116' }} />
            <div className="h-1.5 flex-1" style={{ backgroundColor: '#009460' }} />
          </div>
        </div>
      </footer>
    </div>
  );
}
