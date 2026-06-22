'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

/**
 * Light/dark mode toggle.
 * To avoid hydration mismatch (theme is only known client-side), we render a
 * stable placeholder (Sun icon + neutral aria-label) until the component has
 * mounted on the client. After mount we swap in the real state.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const current = theme === 'system' ? resolvedTheme : theme;
  const isDark = current === 'dark';

  // Stable output until mounted — same on server and first client render.
  const label = mounted
    ? isDark
      ? 'Activer le mode clair'
      : 'Activer le mode sombre'
    : 'Basculer le thème';

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={label}
      title={mounted ? (isDark ? 'Mode clair' : 'Mode sombre') : 'Thème'}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={`h-9 w-9 text-foreground hover:bg-accent hover:text-accent-foreground ${className ?? ''}`}
      // Theme attributes are computed client-side; suppress mismatch warning.
      suppressHydrationWarning
    >
      {mounted ? (
        isDark ? (
          <Sun className="h-[1.2rem] w-[1.2rem] transition-all" />
        ) : (
          <Moon className="h-[1.2rem] w-[1.2rem] transition-all" />
        )
      ) : (
        // Stable placeholder until mounted.
        <Sun className="h-[1.2rem] w-[1.2rem]" />
      )}
      <span className="sr-only">Basculer le thème</span>
    </Button>
  );
}
