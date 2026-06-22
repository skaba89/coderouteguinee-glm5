'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Activity,
  Users,
  CalendarCheck,
  CreditCard,
  AlertTriangle,
  Clock,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  CircleDot,
  CheckCircle2,
  XCircle,
  UserPlus,
  Wifi,
  WifiOff,
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────

interface LiveKPIs {
  totalCandidates: number;
  activeToday: number;
  newCandidatesThisWeek: number;
  bookingsToday: number;
  bookingsThisWeek: number;
  pendingPayments: number;
  successfulPaymentsToday: number;
  failedPaymentsToday: number;
  activeExams: number;
  fraudAlertsActive: number;
  pendingResults: number;
}

interface FeedItem {
  id: string;
  type: 'booking' | 'payment' | 'exam' | 'user' | 'fraud';
  timestamp: string;
  title: string;
  subtitle: string;
  status?: 'success' | 'pending' | 'failed' | 'active' | 'info';
  amount?: number;
}

interface LiveResponse {
  timestamp: string;
  kpis: LiveKPIs;
  feed: FeedItem[];
}

// ─── Constants ─────────────────────────────────────────────

const POLL_INTERVAL_MS = 30_000; // 30 seconds
const COLORS = {
  green: '#009460',
  yellow: '#FCD116',
  red: '#CE1126',
  primaryDark: '#1A2332',
};

// ─── Helpers ───────────────────────────────────────────────

function timeAgo(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = now - then;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}min`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  return `${day}j`;
}

function useRelativeTime(tick: number, iso: string) {
  // Recompute on every tick
  return React.useMemo(() => timeAgo(iso), [tick, iso]);
}

// ─── KPI Card component ────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  iconColor: string;
  trend?: { value: string; up: boolean };
  hint?: string;
  loading?: boolean;
}

function KpiCard({ label, value, icon: Icon, iconColor, trend, hint, loading }: KpiCardProps) {
  return (
    <Card className="border-0 shadow-sm bg-card">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium truncate">
              {label}
            </p>
            {loading ? (
              <div className="h-7 w-16 bg-muted rounded animate-pulse mt-1" />
            ) : (
              <p className="text-2xl font-bold text-foreground mt-1 leading-tight">
                {value}
              </p>
            )}
            {hint && <p className="text-[10px] text-muted-foreground/70 mt-0.5">{hint}</p>}
            {trend && (
              <div className="flex items-center gap-1 mt-1.5">
                {trend.up ? (
                  <TrendingUp className="w-3 h-3" style={{ color: COLORS.green }} />
                ) : (
                  <TrendingDown className="w-3 h-3" style={{ color: COLORS.red }} />
                )}
                <span
                  className="text-[10px] font-medium"
                  style={{ color: trend.up ? COLORS.green : COLORS.red }}
                >
                  {trend.value}
                </span>
              </div>
            )}
          </div>
          <div
            className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${iconColor}15` }}
          >
            <Icon className="h-4.5 w-4.5" style={{ color: iconColor }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Feed item component ───────────────────────────────────

const FEED_ICON: Record<FeedItem['type'], { icon: React.ComponentType<{ className?: string }>; color: string }> = {
  booking: { icon: CalendarCheck, color: COLORS.green },
  payment: { icon: CreditCard, color: COLORS.yellow },
  exam: { icon: CircleDot, color: COLORS.primaryDark },
  user: { icon: UserPlus, color: '#3B82F6' },
  fraud: { icon: AlertTriangle, color: COLORS.red },
};

const STATUS_STYLE: Record<NonNullable<FeedItem['status']>, { dot: string; label: string }> = {
  success: { dot: COLORS.green, label: 'Succès' },
  pending: { dot: COLORS.yellow, label: 'En attente' },
  failed: { dot: COLORS.red, label: 'Échec' },
  active: { dot: COLORS.red, label: 'Actif' },
  info: { dot: '#3B82F6', label: 'Info' },
};

function FeedRow({ item, tick }: { item: FeedItem; tick: number }) {
  const meta = FEED_ICON[item.type];
  const Icon = meta.icon;
  const status = item.status ? STATUS_STYLE[item.status] : null;
  const ago = useRelativeTime(tick, item.timestamp);

  return (
    <div className="flex items-start gap-3 py-2.5 px-3 rounded-md hover:bg-accent/50 transition-colors">
      <div
        className="h-7 w-7 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ backgroundColor: `${meta.color}15` }}
      >
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground truncate">{item.title}</p>
        <p className="text-[11px] text-muted-foreground truncate">{item.subtitle}</p>
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        {status && (
          <div className="flex items-center gap-1">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: status.dot }}
            />
            <span className="text-[10px] text-muted-foreground">{ago}</span>
          </div>
        )}
        {!status && <span className="text-[10px] text-muted-foreground">{ago}</span>}
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────

export function LiveDashboard() {
  const [data, setData] = React.useState<LiveResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null);
  const [tick, setTick] = React.useState(0);

  const fetchLive = React.useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    try {
      const res = await fetch('/api/admin/live', { cache: 'no-store' });
      if (!res.ok) {
        if (res.status === 403) {
          setError('Accès refusé');
          return;
        }
        throw new Error(`HTTP ${res.status}`);
      }
      const json = (await res.json()) as LiveResponse;
      setData(json);
      setLastUpdated(new Date());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial fetch + polling
  React.useEffect(() => {
    fetchLive();
    const id = setInterval(() => fetchLive(true), POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchLive]);

  // Update relative times every 15s
  React.useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 15_000);
    return () => clearInterval(id);
  }, []);

  const kpis = data?.kpis;

  return (
    <div className="space-y-4">
      {/* ─── Header bar ─── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Activity className="h-4 w-4" style={{ color: COLORS.green }} />
            <span
              className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full animate-pulse"
              style={{ backgroundColor: error ? COLORS.red : COLORS.green }}
            />
          </div>
          <h3 className="text-sm font-semibold text-foreground">
            Tableau de bord en temps réel
          </h3>
          <Badge variant="outline" className="text-[10px] gap-1">
            {error ? (
              <>
                <WifiOff className="h-2.5 w-2.5" />
                Hors-ligne
              </>
            ) : (
              <>
                <Wifi className="h-2.5 w-2.5" />
                Live
              </>
            )}
          </Badge>
          {lastUpdated && !error && (
            <span className="text-[10px] text-muted-foreground">
              · MAJ il y a {timeAgo(lastUpdated.toISOString())}
            </span>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1.5"
          onClick={() => fetchLive(true)}
          disabled={refreshing}
        >
          <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* ─── KPI Grid ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        <KpiCard
          label="Candidats actifs (24h)"
          value={kpis?.activeToday ?? 0}
          icon={Users}
          iconColor={COLORS.green}
          hint={`Total: ${kpis?.totalCandidates ?? 0}`}
          loading={loading}
        />
        <KpiCard
          label="Nouveaux (7j)"
          value={kpis?.newCandidatesThisWeek ?? 0}
          icon={UserPlus}
          iconColor="#3B82F6"
          loading={loading}
        />
        <KpiCard
          label="Réservations (24h)"
          value={kpis?.bookingsToday ?? 0}
          icon={CalendarCheck}
          iconColor={COLORS.yellow}
          hint={`Semaine: ${kpis?.bookingsThisWeek ?? 0}`}
          loading={loading}
        />
        <KpiCard
          label="Paiements en attente"
          value={kpis?.pendingPayments ?? 0}
          icon={Clock}
          iconColor={COLORS.yellow}
          loading={loading}
        />
        <KpiCard
          label="Paiements réussis (24h)"
          value={kpis?.successfulPaymentsToday ?? 0}
          icon={CheckCircle2}
          iconColor={COLORS.green}
          hint={`Échoués: ${kpis?.failedPaymentsToday ?? 0}`}
          loading={loading}
        />
        <KpiCard
          label="Alertes fraude"
          value={kpis?.fraudAlertsActive ?? 0}
          icon={AlertTriangle}
          iconColor={COLORS.red}
          hint="Actives"
          loading={loading}
        />
      </div>

      {/* ─── Activity feed ─── */}
      <Card className="border-0 shadow-sm bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Activity className="h-4 w-4" style={{ color: COLORS.green }} />
            Flux d&apos;activité en direct
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 py-2.5 px-3">
                  <div className="h-7 w-7 rounded-md bg-muted animate-pulse" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3 w-48 bg-muted rounded animate-pulse" />
                    <div className="h-2.5 w-32 bg-muted rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <WifiOff className="h-8 w-8 mx-auto mb-2 opacity-50" />
              Impossible de charger le flux.
              <Button
                variant="outline"
                size="sm"
                className="ml-2 h-7 text-xs"
                onClick={() => fetchLive(true)}
              >
                Réessayer
              </Button>
            </div>
          ) : data && data.feed.length > 0 ? (
            <div className="space-y-0.5 max-h-[500px] overflow-y-auto">
              {data.feed.map((item) => (
                <FeedRow key={item.id} item={item} tick={tick} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Aucune activité récente.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
