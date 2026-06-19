'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NationalLanguage } from '@/lib/types';
import {
  Volume2,
  VolumeX,
  Pause,
  Loader2,
} from 'lucide-react';

// ─── Language to speechSynthesis lang code mapping ──────────────
const LANG_CODES: Record<NationalLanguage, string> = {
  fr: 'fr-FR',
  // Local languages disabled for now — will be re-enabled as improvements:
  // ss: 'fr-FR', fu: 'fr-FR', ml: 'fr-FR'
};

const LANG_LABELS: Record<NationalLanguage, string> = {
  fr: 'Français',
  // ss: 'Soussou', fu: 'Poular', ml: 'Malinke'
};

// ─── Waveform bars for animation ──────────────────────────────
function WaveformAnimation({ isPlaying }: { isPlaying: boolean }) {
  return (
    <div className="flex items-center gap-[2px] h-5">
      {Array.from({ length: 12 }, (_, i) => (
        <div
          key={i}
          className={`w-[3px] rounded-full transition-all duration-200 ${
            isPlaying ? 'animate-pulse' : ''
          }`}
          style={{
            backgroundColor: isPlaying ? '#009460' : '#D1D5DB',
            height: isPlaying
              ? `${8 + Math.sin(i * 0.8) * 8}px`
              : '4px',
            animationDelay: isPlaying ? `${i * 0.08}s` : undefined,
            animationDuration: isPlaying ? `${0.5 + (i % 3) * 0.2}s` : undefined,
          }}
        />
      ))}
    </div>
  );
}

// ─── Props ─────────────────────────────────────────────────────
interface TTSPlayerProps {
  text: string;
  language: NationalLanguage;
  /** Whether to auto-play when mounted (default: false) */
  autoPlay?: boolean;
  /** Compact mode for inline use in exam */
  compact?: boolean;
  /** Whether to show the language badge */
  showLanguageBadge?: boolean;
  /** Additional CSS class */
  className?: string;
  /** Optional label for the player */
  label?: string;
  /** Callback when speech starts */
  onSpeechStart?: () => void;
  /** Callback when speech ends */
  onSpeechEnd?: () => void;
}

// ─── TTS Player Component ─────────────────────────────────────
export default function TTSPlayer({
  text,
  language,
  autoPlay = false,
  compact = false,
  showLanguageBadge = false,
  className = '',
  label,
  onSpeechStart,
  onSpeechEnd,
}: TTSPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // When the text prop changes (e.g. user navigated to a new question),
  // cancel any ongoing speech. This is critical for autoPlay to work
  // correctly across question changes — otherwise the new autoPlay would
  // call speak() while isPlaying is still true from the previous question,
  // and speak() would pause instead of playing the new text.
  //
  // State resets (isPlaying/isPaused/isLoading) are NOT done here to avoid
  // the react-hooks/set-state-in-effect lint rule. Instead, the speech
  // synthesis callbacks (onstart, onend, onerror) will sync the state
  // naturally — when we cancel() the previous utterance, its onend fires
  // and resets isPlaying to false.
  const previousTextRef = useRef(text);
  useEffect(() => {
    if (previousTextRef.current !== text) {
      previousTextRef.current = text;
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    }
  }, [text]);

  const speak = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    // If currently playing, pause/resume
    if (isPlaying && !isPaused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      return;
    }

    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    setIsLoading(true);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = LANG_CODES[language] || 'fr-FR';
    utterance.rate = 0.9;
    utterance.pitch = 1;

    // Try to find an appropriate voice
    const voices = window.speechSynthesis.getVoices();
    const langCode = LANG_CODES[language] || 'fr-FR';
    const matchingVoice = voices.find(v => v.lang === langCode) || voices.find(v => v.lang.startsWith('fr'));
    if (matchingVoice) utterance.voice = matchingVoice;

    utterance.onstart = () => {
      setIsLoading(false);
      setIsPlaying(true);
      setIsPaused(false);
      onSpeechStart?.();
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      onSpeechEnd?.();
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setIsLoading(false);
      onSpeechEnd?.();
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [text, language, isPlaying, isPaused, onSpeechStart, onSpeechEnd]);

  const stop = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setIsLoading(false);
  }, []);

  // Auto-play
  useEffect(() => {
    if (autoPlay && text) {
      const timer = setTimeout(() => speak(), 500);
      return () => clearTimeout(timer);
    }
  }, [autoPlay, text, speak]);

  const langLabel = LANG_LABELS[language] || 'Français';

  // ─── Compact mode ────────────────────────────────────────
  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Button
          variant="ghost"
          size="sm"
          className={`h-8 w-8 p-0 rounded-full ${
            isPlaying
              ? 'bg-green-50 text-green-600 hover:bg-green-100'
              : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
          }`}
          onClick={isPlaying ? stop : speak}
          disabled={isLoading}
          title={isPlaying ? 'Arrêter la lecture' : 'Lire la question'}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
        </Button>
        {isPlaying && <WaveformAnimation isPlaying={isPlaying} />}
      </div>
    );
  }

  // ─── Full mode ───────────────────────────────────────────
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
        isPlaying
          ? 'border-green-300 bg-green-50/50 shadow-sm'
          : 'border-gray-200 bg-white hover:border-green-200'
      } ${className}`}
    >
      {/* Play/Stop Button */}
      <Button
        variant="outline"
        size="sm"
        className={`h-9 w-9 p-0 rounded-full border-2 flex-shrink-0 transition-colors ${
          isPlaying
            ? 'border-green-500 bg-green-500 text-white hover:bg-green-600 hover:border-green-600'
            : 'border-gray-300 text-gray-500 hover:border-green-400 hover:text-green-600 hover:bg-green-50'
        }`}
        onClick={isPlaying ? stop : speak}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isPlaying ? (
          <VolumeX className="w-4 h-4" />
        ) : (
          <Volume2 className="w-4 h-4" />
        )}
      </Button>

      {/* Waveform + info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          {label && (
            <span className="text-xs font-medium text-gray-700 truncate">{label}</span>
          )}
          {showLanguageBadge && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 h-4 flex-shrink-0"
              style={{
                borderColor: '#1A2332',
                color: '#1A2332',
                backgroundColor: '#F3F4F6',
              }}
            >
              {langLabel}
            </Badge>
          )}
        </div>
        <WaveformAnimation isPlaying={isPlaying} />
      </div>

      {/* Status text */}
      <span className="text-xs text-gray-400 flex-shrink-0">
        {isLoading ? 'Chargement...' : isPlaying ? (isPaused ? 'En pause' : 'Lecture...') : ''}
      </span>
    </div>
  );
}
