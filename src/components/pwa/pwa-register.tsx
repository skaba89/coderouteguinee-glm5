'use client';

import * as React from 'react';
import { InstallPWA } from './install-prompt';

/**
 * Client-side PWA bootstrap.
 * 1. Registers the service worker (cache-first for static assets, network-first for navigations).
 * 2. Mounts the install prompt banner (only shown when `beforeinstallprompt` fires).
 */
export function PWARegister() {
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    // Only register in production or when explicitly enabled.
    // In dev (next dev), HMR + SW caching conflicts cause confusion, so we skip by default.
    if (process.env.NODE_ENV === 'development') {
      // Allow opt-in via ?sw=1 for testing in dev
      const params = new URLSearchParams(window.location.search);
      if (params.get('sw') !== '1') return;
    }

    const register = () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((reg) => {
          // Listen for updates
          reg.addEventListener('updatefound', () => {
            const installing = reg.installing;
            if (!installing) return;
            installing.addEventListener('statechange', () => {
              if (
                installing.state === 'installed' &&
                navigator.serviceWorker.controller
              ) {
                // New content available — could trigger a toast; keep silent for now.
                console.info('[PWA] Nouveau contenu disponible (recharger pour appliquer).');
              }
            });
          });
        })
        .catch((err) => console.warn('[PWA] SW registration failed:', err));
    };

    if (document.readyState === 'complete') register();
    else window.addEventListener('load', register);
  }, []);

  return <InstallPWA />;
}
