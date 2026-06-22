'use client';

import { Button } from '@/components/ui/button';
import { Car, WifiOff, RefreshCw, Home } from 'lucide-react';

export default function OfflinePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background text-foreground p-4">
      <div className="max-w-md w-full text-center">
        {/* Guinea tricolor stripe */}
        <div className="h-1 flex rounded-full overflow-hidden mb-8">
          <div className="flex-1" style={{ backgroundColor: '#CE1126' }} />
          <div className="flex-1" style={{ backgroundColor: '#FCD116' }} />
          <div className="flex-1" style={{ backgroundColor: '#009460' }} />
        </div>

        <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-muted mb-6">
          <WifiOff className="h-10 w-10 text-muted-foreground" />
        </div>

        <h1 className="text-2xl font-bold tracking-tight mb-2">
          Vous êtes hors-ligne
        </h1>
        <p className="text-muted-foreground text-sm mb-6">
          CodeRoute Guinée ne peut pas atteindre internet pour le moment.
          Vous pouvez continuer à consulter les pages déjà visitées
          (cours, leçons, panneau de signaux), et reprendre votre activité
          dès que la connexion revient.
        </p>

        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Button
            onClick={() => window.location.reload()}
            className="text-white"
            style={{ backgroundColor: '#009460' }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Réessayer
          </Button>
          <Button
            variant="outline"
            onClick={() => { window.location.href = '/'; }}
          >
            <Home className="h-4 w-4 mr-2" />
            Page d&apos;accueil
          </Button>
        </div>

        <div className="mt-8 pt-6 border-t border-border flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <div className="w-5 h-5 rounded flex items-center justify-center" style={{ backgroundColor: '#009460' }}>
            <Car className="h-3 w-3 text-white" />
          </div>
          <span>CodeRoute <strong>Guinée</strong></span>
          <span className="text-muted-foreground/60">·</span>
          <span>Ministère des Transports</span>
        </div>
      </div>
    </main>
  );
}
