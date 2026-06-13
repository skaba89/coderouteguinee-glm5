'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { NationalLanguage, ViewType } from '@/lib/types';
import { languages } from '@/lib/mock-data';
import { useLanguage } from '@/lib/language-context';
import { Check, Globe, ArrowLeft, ChevronRight, Users, MapPin } from 'lucide-react';

interface LanguageSelectionProps {
  onViewChange: (view: ViewType) => void;
  onSelect: (lang: NationalLanguage) => void;
  context: 'exam' | 'course' | 'registration';
}

const contextSubtitles: Record<string, string> = {
  exam: 'Sélectionnez la langue dans laquelle vous souhaitez passer l\'examen',
  course: 'Sélectionnez la langue dans laquelle vous souhaitez suivre les cours',
  registration: 'Sélectionnez votre langue maternelle pour votre inscription',
};

const contextHeadings: Record<string, string> = {
  exam: 'Sélectionnez la langue dans laquelle vous souhaitez passer l\'examen',
  course: 'Sélectionnez la langue pour votre parcours d\'apprentissage',
  registration: 'Indiquez votre langue maternelle pour votre dossier d\'inscription',
};

const languageEmojis: Record<NationalLanguage, { emoji: string; label: string; bgGradient: string; accentColor: string }> = {
  fr: {
    emoji: '🇫🇷',
    label: 'Français',
    bgGradient: 'from-blue-900/40 to-slate-800/40',
    accentColor: '#3b5998',
  },
  ss: {
    emoji: '🌊',
    label: 'Soussou',
    bgGradient: 'from-cyan-900/40 to-teal-800/40',
    accentColor: '#0891b2',
  },
  fu: {
    emoji: '⛰️',
    label: 'Poular',
    bgGradient: 'from-amber-900/40 to-orange-800/40',
    accentColor: '#b45309',
  },
  ml: {
    emoji: '🌳',
    label: 'Malinké',
    bgGradient: 'from-emerald-900/40 to-green-800/40',
    accentColor: '#047857',
  },
};

export default function LanguageSelection({ onViewChange, onSelect, context }: LanguageSelectionProps) {
  const { currentLanguage, setLanguage } = useLanguage();
  const [selectedLang, setSelectedLang] = useState<NationalLanguage | null>(currentLanguage || null);
  const [hoveredLang, setHoveredLang] = useState<NationalLanguage | null>(null);

  const handleSelect = (lang: NationalLanguage) => {
    setSelectedLang(lang);
    setLanguage(lang);
  };

  const handleContinue = () => {
    if (selectedLang) {
      onSelect(selectedLang);
    }
  };

  const handleBack = () => {
    onViewChange('landing');
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #1A2332 0%, #0d1a2d 100%)' }}>
      {/* Guinea Flag Stripe */}
      <div className="w-full flex flex-col flex-shrink-0" style={{ height: '12px' }}>
        <div className="flex-1" style={{ backgroundColor: '#CE1126' }} />
        <div className="flex-1" style={{ backgroundColor: '#FCD116' }} />
        <div className="flex-1" style={{ backgroundColor: '#009460' }} />
      </div>

      {/* Decorative Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {/* Top-right radial glow */}
        <div
          className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full opacity-[0.07]"
          style={{ background: 'radial-gradient(circle, #009460 0%, transparent 70%)' }}
        />
        {/* Bottom-left radial glow */}
        <div
          className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full opacity-[0.05]"
          style={{ background: 'radial-gradient(circle, #CE1126 0%, transparent 70%)' }}
        />
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
        {/* Floating geometric accents */}
        <div className="absolute top-1/4 left-[8%] w-2 h-2 rounded-full bg-[#FCD116] opacity-20" />
        <div className="absolute top-1/3 right-[12%] w-1.5 h-1.5 rounded-full bg-[#009460] opacity-25" />
        <div className="absolute bottom-1/3 left-[15%] w-1 h-1 rounded-full bg-[#CE1126] opacity-20" />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 sm:px-6 lg:px-8 relative z-10">
        {/* Header Section */}
        <div className="text-center mb-8 sm:mb-10 max-w-2xl">
          {/* Globe icon */}
          <div className="flex justify-center mb-5">
            <div className="relative">
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #009460 0%, #009460/60 100%)', boxShadow: '0 0 30px rgba(0,148,96,0.3)' }}>
                <Globe className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#FCD116] flex items-center justify-center shadow-lg">
                <span className="text-[10px]">🇬🇳</span>
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 tracking-tight">
            Choisissez votre langue
          </h1>
          <p className="text-base sm:text-lg text-slate-400 mb-1">
            Choose your language
          </p>
          {/* Subtitle - adapts based on context */}
          <p className="text-sm sm:text-base text-slate-500 mt-3 leading-relaxed max-w-lg mx-auto">
            {contextSubtitles[context]}
          </p>

          {/* Context indicator */}
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium tracking-wide uppercase" style={{ backgroundColor: 'rgba(0,148,96,0.15)', color: '#009460', border: '1px solid rgba(0,148,96,0.25)' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#009460' }} />
            {context === 'exam' ? 'Examen théorique' : context === 'course' ? 'Formation' : 'Inscription'}
          </div>
        </div>

        {/* Language Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 w-full max-w-3xl mb-8 sm:mb-10">
          {languages.map((lang) => {
            const isSelected = selectedLang === lang.code;
            const isHovered = hoveredLang === lang.code;
            const emojiConfig = languageEmojis[lang.code];

            return (
              <Card
                key={lang.code}
                className={`
                  relative cursor-pointer transition-all duration-300 ease-out
                  border-2 overflow-hidden group
                  ${isSelected
                    ? 'border-[#009460] shadow-[0_0_20px_rgba(0,148,96,0.25),0_0_40px_rgba(0,148,96,0.1)] scale-[1.02]'
                    : 'border-slate-700/60 hover:border-slate-500/80'
                  }
                  ${isHovered && !isSelected ? 'scale-[1.01] shadow-lg shadow-black/20' : ''}
                  hover:shadow-xl
                `}
                style={{
                  background: isSelected
                    ? 'linear-gradient(135deg, rgba(0,148,96,0.12) 0%, rgba(26,35,50,0.95) 100%)'
                    : 'linear-gradient(135deg, rgba(26,35,50,0.8) 0%, rgba(13,26,45,0.95) 100%)',
                  backdropFilter: 'blur(10px)',
                }}
                onClick={() => handleSelect(lang.code)}
                onMouseEnter={() => setHoveredLang(lang.code)}
                onMouseLeave={() => setHoveredLang(null)}
                role="button"
                tabIndex={0}
                aria-label={`Select ${lang.name} language`}
                aria-pressed={isSelected}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelect(lang.code);
                  }
                }}
              >
                {/* Subtle top gradient bar per language */}
                <div
                  className="absolute top-0 left-0 right-0 h-0.5 opacity-60"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${emojiConfig.accentColor}, transparent)`,
                  }}
                />

                <CardContent className="p-5 sm:p-6">
                  <div className="flex items-start gap-4">
                    {/* Emoji / Icon */}
                    <div
                      className={`
                        flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center
                        transition-all duration-300 text-2xl sm:text-3xl
                        ${isSelected ? 'ring-2 ring-[#009460]/50' : ''}
                      `}
                      style={{
                        background: isSelected
                          ? 'linear-gradient(135deg, rgba(0,148,96,0.25) 0%, rgba(0,148,96,0.1) 100%)'
                          : `linear-gradient(135deg, ${emojiConfig.accentColor}20 0%, ${emojiConfig.accentColor}10 100%)`,
                      }}
                    >
                      {lang.flag}
                    </div>

                    {/* Language Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-lg sm:text-xl font-bold text-white leading-tight">
                          {lang.name}
                        </h3>
                        {/* Selected checkmark */}
                        {isSelected && (
                          <div
                            className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center animate-in fade-in zoom-in duration-200"
                            style={{ backgroundColor: '#009460' }}
                          >
                            <Check className="w-4 h-4 text-white" strokeWidth={3} />
                          </div>
                        )}
                      </div>

                      {/* Native name */}
                      {lang.nativeName !== lang.name && (
                        <p className="text-sm font-medium mt-0.5" style={{ color: emojiConfig.accentColor }}>
                          {lang.nativeName}
                        </p>
                      )}

                      {/* Regions */}
                      <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{lang.regions.join(' · ')}</span>
                      </div>

                      {/* Population / Status */}
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
                        <Users className="w-3 h-3 flex-shrink-0" />
                        <span>{lang.population}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>

                {/* Hover/selection shine effect */}
                <div
                  className={`
                    absolute inset-0 pointer-events-none transition-opacity duration-300
                    ${isSelected ? 'opacity-100' : isHovered ? 'opacity-50' : 'opacity-0'}
                  `}
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 50%)',
                  }}
                />
              </Card>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full max-w-3xl">
          {/* Back Button */}
          <Button
            variant="outline"
            onClick={handleBack}
            className="
              w-full sm:w-auto order-2 sm:order-1
              border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white hover:border-slate-500
              transition-all duration-200
            "
            size="lg"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>

          {/* Continue Button */}
          <Button
            onClick={handleContinue}
            disabled={!selectedLang}
            className="
              w-full sm:w-auto order-1 sm:order-2
              text-white font-semibold text-base
              transition-all duration-300
              disabled:opacity-40 disabled:cursor-not-allowed
            "
            size="lg"
            style={{
              backgroundColor: selectedLang ? '#009460' : '#374151',
              boxShadow: selectedLang
                ? '0 4px 20px rgba(0,148,96,0.35), 0 0 0 1px rgba(0,148,96,0.2)'
                : 'none',
            }}
            onMouseEnter={(e) => {
              if (selectedLang) {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#00a86b';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 28px rgba(0,148,96,0.45), 0 0 0 1px rgba(0,148,96,0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedLang) {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#009460';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 20px rgba(0,148,96,0.35), 0 0 0 1px rgba(0,148,96,0.2)';
              }
            }}
          >
            Continuer
            <ChevronRight className="w-5 h-5 ml-1" />
          </Button>
        </div>

        {/* Footer Info */}
        <div className="mt-8 sm:mt-10 text-center">
          <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
            République de Guinée — Ministère des Transports · Code de la Route Guinée
          </p>
          <div className="flex justify-center gap-4 mt-3">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-600">
              <div className="w-2 h-1.5 rounded-sm" style={{ backgroundColor: '#CE1126' }} />
              <div className="w-2 h-1.5 rounded-sm" style={{ backgroundColor: '#FCD116' }} />
              <div className="w-2 h-1.5 rounded-sm" style={{ backgroundColor: '#009460' }} />
              <span>Guinée</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
