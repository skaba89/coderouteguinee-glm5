'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ThemeProviderProps } from 'next-themes';

/**
 * Theme provider wrapper around next-themes.
 * - attribute="class" toggles `.dark` on <html> so it works with our Tailwind v4 `@custom-variant dark`
 * - defaultTheme="system" respects OS preference on first visit
 * - enableSystem + disableTransitionOnChange for smooth UX
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
