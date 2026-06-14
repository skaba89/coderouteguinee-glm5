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

  // Local languages disabled — always French for now
  const setLanguage = useCallback((_lang: NationalLanguage) => {
    setCurrentLanguage('fr');
  }, []);

  const languageConfig = languages[0]; // Always French
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
