'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { NationalLanguage } from './types';
import { languages } from './mock-data';

interface LanguageContextType {
  currentLanguage: NationalLanguage;
  setLanguage: (lang: NationalLanguage) => void;
  languageConfig: typeof languages[0];
  allLanguages: typeof languages;
  getDirection: () => 'ltr' | 'rtl';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState<NationalLanguage>('fr');

  // Hydrate from localStorage after mount to avoid SSR mismatch
  useEffect(() => {
    try {
      const stored = localStorage.getItem('coderoute_language');
      if (stored && ['fr', 'ss', 'fu', 'ml'].includes(stored)) {
        // Use a microtask to avoid synchronous setState in effect
        queueMicrotask(() => setCurrentLanguage(stored as NationalLanguage));
      }
    } catch {}
  }, []);

  const setLanguage = useCallback((lang: NationalLanguage) => {
    setCurrentLanguage(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('coderoute_language', lang);
    }
  }, []);

  const languageConfig = languages.find(l => l.code === currentLanguage) || languages[0];
  const allLanguages = languages;
  const getDirection = useCallback(() => 'ltr' as const, []);

  return (
    <LanguageContext.Provider value={{ currentLanguage, setLanguage, languageConfig, allLanguages, getDirection }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
