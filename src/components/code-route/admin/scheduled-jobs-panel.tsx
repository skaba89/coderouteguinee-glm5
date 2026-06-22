'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth-context';
import {
  Bell,
  Clock,
  Play,
  Loader2,
  CheckCircle2,
  XCircle,
  Calendar,
  Mail,
  AlertCircle,
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────

interface JobResult {
  job: string;
  processed: number;
  sent: number;
  failed: number;
  errors: string[];
  durationMs: number;
}

interface CronSummary {
  startedAt: string;
  finishedAt: string;
  totalDurationMs: number;
  results: JobResult[];
  authorizedVia?: string;
}

interface JobDefinition {
  name: string;
  label: string;
  description: string;
  schedule: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

// ─── Job definitions (must match scheduled-notifications.ts) ──

const JOBS: JobDefinition[] = [
  {
    name: 'examReminder24h',
    label: 'Rappel examen J-24h',
    description: 'Envoie un email + SMS aux candidats dont l\'examen est dans ~24h.',
    schedule: 'Toutes les heures',
    icon: Clock,
    color: '#009460',
  },
  {
    name: 'examReminder2h',
    label: 'Rappel examen J-2h',
    description: 'SMS de rappel aux candidats dont l\'examen est dans ~2h.',
    schedule: 'Toutes les heures',
    icon: Bell,
    color: '#FCD116',
  },
  {
    name: 'paymentPending7d',
    label: 'Paiements en attente 7j+',
    description: 'Alerte les candidats dont le paiement est en attente depuis +7 jours.',
    schedule: 'Quotidien à 9h',
    icon: AlertCircle,
    color: '#CE1126',
  },
  {
    name: 'weeklyAdminDigest',
    label: 'Résumé hebdo admin',
    description: 'Email récapitulatif hebdomadaire envoyé aux super-admins (lundi 8h).',
    schedule: 'Lundi 8h',
    icon: Mail,
    color: '#3B82F6',
  },
  {
    name: 'inactiveUserNudge',
    label: 'Candidats inactifs 14j+',
    description: 'Relance par email les candidats inactifs depuis +14 jours.',
    schedule: 'Quotidien à 10h',
    icon: Calendar,
    color: '#8B5CF6',
  },
];

// ─── Component ─────────────────────────────────────────────

export function ScheduledJobsPanel() {
  const { apiFetch } = useAuth();
  const [running, setRunning] = React.useState<string | null>(null);
  const [lastResults, setLastResults] = React.useState<Record<string, JobResult>>({});
  const [lastFullRun, setLastFullRun] = React.useState<CronSummary | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const runJob = async (jobName: string | 'all') => {
    setRunning(jobName);
    setError(null);
    try {
      const url =
        jobName === 'all'
          ? '/api/cron/notifications'
          : `/api/cron/notifications?job=${encodeURIComponent(jobName)}`;
      const res = await apiFetch(url, { method: 'POST' });
      if (!res.ok) {
        const e = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(e.error || `HTTP ${res.status}`);
      }
      const summary = (await res.json()) as CronSummary;
      const newResults: Record<string, JobResult> = { ...lastResults };
      for (const r of summary.results) {
        newResults[r.job] = r;
      }
      setLastResults(newResults);
      setLastFullRun(summary);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setRunning(null);
    }
  };

  return (
    <Card className="border-0 shadow-sm bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4" style={{ color: '#009460' }} />
            Tâches planifiées (notifications)
          </CardTitle>
          <Button
            size="sm"
            className="h-7 text-xs gap-1.5 text-white"
            style={{ backgroundColor: '#009460' }}
            onClick={() => runJob('all')}
            disabled={running !== null}
          >
            {running === 'all' ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Play className="h-3 w-3" />
            )}
            Tout exécuter
          </Button>
        </div>
        {lastFullRun && (
          <p className="text-[10px] text-muted-foreground mt-1">
            Dernière exécution : {new Date(lastFullRun.finishedAt).toLocaleString('fr-FR')} ·{' '}
            {lastFullRun.totalDurationMs}ms · autorisé via{' '}
            <code className="text-[10px] bg-muted px-1 rounded">
              {lastFullRun.authorizedVia}
            </code>
          </p>
        )}
        {error && (
          <p className="text-[11px] text-red-600 mt-1">Erreur : {error}</p>
        )}
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        <div className="rounded-md border border-border bg-muted/30 p-2 mb-2">
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Ces jobs s&apos;exécutent automatiquement selon la planification indiquée. Vous pouvez
            les déclencher manuellement pour tester ou rattraper un envoi manqué.
            Configurez un cron externe qui appelle{' '}
            <code className="text-[10px] bg-background px-1 rounded border border-border">
              POST /api/cron/notifications
            </code>{' '}
            avec l&apos;en-tête{' '}
            <code className="text-[10px] bg-background px-1 rounded border border-border">
              Authorization: Bearer $CRON_SECRET
            </code>
            .
          </p>
        </div>

        {JOBS.map((job) => {
          const result = lastResults[job.name];
          const Icon = job.icon;
          const isRunning = running === job.name;
          return (
            <div
              key={job.name}
              className="flex items-center gap-3 p-2.5 rounded-md border border-border hover:bg-accent/30 transition-colors"
            >
              <div
                className="h-8 w-8 rounded-md flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${job.color}15` }}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xs font-semibold text-foreground">{job.label}</p>
                  <Badge variant="outline" className="text-[9px] h-4">
                    {job.schedule}
                  </Badge>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">{job.description}</p>
                {result && (
                  <div className="flex items-center gap-3 mt-1.5 text-[10px]">
                    <span className="text-muted-foreground">
                      Traitées : <strong className="text-foreground">{result.processed}</strong>
                    </span>
                    <span className="flex items-center gap-0.5" style={{ color: '#009460' }}>
                      <CheckCircle2 className="h-2.5 w-2.5" />
                      {result.sent} envoyées
                    </span>
                    {result.failed > 0 && (
                      <span className="flex items-center gap-0.5" style={{ color: '#CE1126' }}>
                        <XCircle className="h-2.5 w-2.5" />
                        {result.failed} échecs
                      </span>
                    )}
                    <span className="text-muted-foreground/60">· {result.durationMs}ms</span>
                    {result.errors.length > 0 && (
                      <details className="text-muted-foreground">
                        <summary className="cursor-pointer hover:text-foreground">
                          {result.errors.length} erreur(s)
                        </summary>
                        <ul className="mt-1 ml-3 space-y-0.5 text-[9px]">
                          {result.errors.slice(0, 5).map((e, i) => (
                            <li key={i} className="font-mono">{e}</li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </div>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs gap-1 flex-shrink-0"
                onClick={() => runJob(job.name)}
                disabled={running !== null}
              >
                {isRunning ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Play className="h-3 w-3" />
                )}
                Exécuter
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
