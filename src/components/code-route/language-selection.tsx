'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { NationalLanguage, ViewType } from '@/lib/types';
import {
  ArrowLeft,
  Check,
  Globe,
  ChevronRight,
  Flag,
  Languages,
} from 'lucide-react';

interface LanguageSelectionProps {
  onViewChange: (view: ViewType) => void;
  onSelect: (lang: NationalLanguage) => void;
  context: 'exam' | 'course' | 'registration';
}

// Note: Local languages (Soussou, Poular, Malinké) are temporarily disabled.
// This component shows a simple French-only selection for now.
// It will be fully restored when local language support is re-enabled.

export default function LanguageSelection({ onViewChange, onSelect, context }: LanguageSelectionProps) {
  const handleBack = () => {
    switch (context) {
      case 'exam':
        onViewChange('candidate-dashboard');
        break;
      case 'course':
        onViewChange('candidate-dashboard');
        break;
      case 'registration':
        onViewChange('landing');
        break;
      default:
        onViewChange('candidate-dashboard');
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #1A2332 0%, #0d1a2d 100%)' }}>
      {/* Guinea Flag Stripe */}
      <div className="w-full flex flex-col flex-shrink-0" style={{ height: '12px' }}>
        <div className="flex-1" style={{ backgroundColor: '#CE1126' }} />
        <div className="flex-1" style={{ backgroundColor: '#FCD116' }} />
        <div className="flex-1" style={{ backgroundColor: '#009460' }} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 sm:px-6 lg:px-8 relative z-10">
        {/* Header Section */}
        <div className="text-center mb-8 sm:mb-10 max-w-2xl">
          <div className="flex justify-center mb-5">
            <div className="relative">
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #009460 0%, #009460/60 100%)', boxShadow: '0 0 30px rgba(0,148,96,0.3)' }}>
                <Globe className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#FCD116] flex items-center justify-center shadow-lg">
                <Languages className="w-3 h-3 text-[#1A2332]" />
              </div>
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 tracking-tight">
            Langue de l&apos;examen
          </h1>
          <p className="text-sm sm:text-base text-slate-500 mt-3 leading-relaxed max-w-lg mx-auto">
            L&apos;examen est actuellement disponible uniquement en français.
          </p>
        </div>

        {/* French Language Card */}
        <div className="w-full max-w-md mb-8">
          <div
            className="relative border-2 border-[#009460] rounded-xl overflow-hidden shadow-[0_0_20px_rgba(0,148,96,0.25)]"
            style={{
              background: 'linear-gradient(135deg, rgba(0,148,96,0.12) 0%, rgba(26,35,50,0.95) 100%)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <div className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center ring-2 ring-[#009460]/50"
                  style={{ background: 'linear-gradient(135deg, rgba(0,148,96,0.25) 0%, rgba(0,148,96,0.1) 100%)' }}>
                  <Flag className="w-7 h-7" style={{ color: '#009460' }} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white">Français</h3>
                  <p className="text-sm text-slate-400">Langue officielle</p>
                </div>
                <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: '#009460' }}>
                  <Check className="w-4 h-4 text-white" strokeWidth={3} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Coming soon notice */}
        <div className="mb-8 p-4 rounded-xl border border-slate-700/60 max-w-md w-full text-center"
          style={{ background: 'rgba(26,35,50,0.8)' }}>
          <p className="text-slate-400 text-sm">
            <span className="text-[#FCD116] font-semibold">Bientôt disponible :</span> Soussou, Poular, Malinké
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full max-w-md">
          <Button
            variant="outline"
            onClick={handleBack}
            className="w-full sm:w-auto order-2 sm:order-1 border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white hover:border-slate-500 transition-all duration-200"
            size="lg"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>

          <Button
            onClick={() => onSelect('fr')}
            className="w-full sm:w-auto order-1 sm:order-2 text-white font-semibold text-base transition-all duration-300"
            size="lg"
            style={{
              backgroundColor: '#009460',
              boxShadow: '0 4px 20px rgba(0,148,96,0.35), 0 0 0 1px rgba(0,148,96,0.2)',
            }}
          >
            Continuer en Français
            <ChevronRight className="w-5 h-5 ml-1" />
          </Button>
        </div>

        {/* Footer */}
        <div className="mt-8 sm:mt-10 text-center">
          <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
            République de Guinée — Ministère des Transports · Code de la Route Guinée
          </p>
        </div>
      </div>
    </div>
  );
}
