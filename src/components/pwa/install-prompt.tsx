'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { X, Download, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  prompt: () => Promise<void>;
}

const DISMISS_KEY = 'pwa-install-dismissed-at';
const DISMISS_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

/**
 * Shows a "Installer l'application" banner when the browser fires
 * `beforeinstallprompt`. After 7 days since last dismissal, it can show again.
 */
export function InstallPWA() {
  const [deferred, setDeferred] = React.useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    // Already installed (standalone) → don't prompt.
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      // iOS Safari
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) return;

    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
    if (dismissedAt && Date.now() - dismissedAt < DISMISS_TTL_MS) return;

    const onBefore = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    const onInstalled = () => {
      setVisible(false);
      setDeferred(null);
      console.info('[PWA] Application installée.');
    };

    window.addEventListener('beforeinstallprompt', onBefore);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBefore);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (!visible || !deferred) return null;

  const accept = async () => {
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === 'dismissed') {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    }
    setVisible(false);
    setDeferred(null);
  };

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-label="Installer l'application CodeRoute Guinée"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-2rem)] max-w-md"
    >
      <div className="rounded-xl border border-border bg-card text-card-foreground shadow-2xl backdrop-blur p-4 flex items-start gap-3">
        <div className="rounded-lg flex items-center justify-center h-10 w-10 flex-shrink-0" style={{ backgroundColor: '#009460' }}>
          <Smartphone className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-tight">Installer CodeRoute Guinée</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Accédez à l'examen du code même hors-ligne, plus rapidement depuis votre écran d'accueil.
          </p>
          <div className="flex items-center gap-2 mt-3">
            <Button size="sm" onClick={accept} className="h-8 text-white" style={{ backgroundColor: '#009460' }}>
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Installer
            </Button>
            <Button size="sm" variant="ghost" onClick={dismiss} className="h-8">
              Plus tard
            </Button>
          </div>
        </div>
        <Button
          size="icon"
          variant="ghost"
          onClick={dismiss}
          className="h-7 w-7 flex-shrink-0"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
