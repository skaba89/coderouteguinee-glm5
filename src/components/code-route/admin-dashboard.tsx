'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ViewType, FraudAlert, FraudSeverity, RegionalStat, Centre, NationalLanguage } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { languages } from '@/lib/mock-data';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import {
  Users,
  Building2,
  FileCheck,
  AlertTriangle,
  TrendingUp,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Phone,
  Eye,
  BarChart3,
  Globe,
  Activity,
  Search,
  Filter,
  Download,
  RefreshCw,
  ChevronRight,
  CircleAlert,
  Ban,
  AlertOctagon,
  Settings,
  LayoutDashboard,
  FileDown,
  ChevronDown,
  Bell,
  Loader2,
} from 'lucide-react';

// ─── Color Palette ──────────────────────────────────────
const COLORS = {
  primaryDark: '#1A2332',
  red: '#CE1126',
  yellow: '#FCD116',
  green: '#009460',
};

const CHART_COLORS = ['#009460', '#FCD116', '#CE1126', '#1A2332', '#7C3AED', '#0EA5E9'];

// ─── API Response Type ─────────────────────────────────
interface ApiKpi {
  totalCandidates: number;
  totalExams: number;
  passedExams: number;
  totalCentres: number;
  totalRevenue: number;
  avgSuccessRate: number;
  activeFraudAlerts: number;
}

interface ApiMonthlyVolume {
  month: string;
  totalExamens: number;
  reussis: number;
  revenue: number;
}

interface ApiFraudAlert {
  id: string;
  type: string;
  description: string;
  severity: string;
  status: string;
  candidatId?: string;
  centreId?: string;
  timestamp: string;
  details?: string;
  candidat?: { id: string; nom: string; prenom: string; numeroUnique: string };
  centre?: { id: string; nom: string; ville: string };
}

interface ApiCentre {
  id: string;
  nom: string;
  ville: string;
  region: string;
  adresse: string;
  capacite: number;
  telephone: string;
  email: string;
  actif: boolean;
  accredDateDebut?: string;
  accredDateFin?: string;
  accredStatut: string;
  accredScore: number;
  equipements?: string[];
  languesDisponibles: string[];
  createdAt: string;
  updatedAt: string;
}

interface ApiCategoryScore {
  categorie: string;
  score: number;
}

interface ApiFraudBySeverity {
  severity: string;
  _count: { id: number };
}

interface ApiDailyStat {
  id: string;
  date: string;
  centreId?: string;
  exams: number;
  passed: number;
  failed: number;
  cancelled: number;
  avgScore: number;
  revenue: number;
}

interface ApiResponse {
  kpi: ApiKpi;
  monthlyExamVolume: ApiMonthlyVolume[];
  regionalStats: RegionalStat[];
  fraudAlerts: ApiFraudAlert[];
  centres: ApiCentre[];
  categoryScores: ApiCategoryScore[];
  fraudBySeverity: ApiFraudBySeverity[];
  dailyStats: ApiDailyStat[];
}

// ─── Helpers ────────────────────────────────────────────
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-GN').format(amount) + ' GNF';
}

function formatTimestamp(ts: string): string {
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffH = Math.floor(diffMs / 3600000);
  if (diffH < 1) return 'Il y a moins d\'1h';
  if (diffH < 24) return `Il y a ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  return `Il y a ${diffD}j`;
}

function getSeverityConfig(severity: FraudSeverity) {
  switch (severity) {
    case 'critical': return { label: 'Critique', color: '#CE1126', bg: '#CE112610', border: '#CE1126' };
    case 'high': return { label: 'Élevé', color: '#E85D04', bg: '#E85D0410', border: '#E85D04' };
    case 'medium': return { label: 'Moyen', color: '#FCD116', bg: '#FCD11610', border: '#FCD116' };
    case 'low': return { label: 'Faible', color: '#009460', bg: '#00946010', border: '#009460' };
    default: return { label: 'Info', color: '#6B7280', bg: '#6B728010', border: '#6B7280' };
  }
}

function getStatusConfig(status: string) {
  switch (status) {
    case 'active': return { label: 'Active', color: '#CE1126', bg: '#CE112615' };
    case 'investigating': return { label: 'En investigation', color: '#FCD116', bg: '#FCD11615' };
    case 'resolved': return { label: 'Résolue', color: '#009460', bg: '#00946015' };
    default: return { label: status, color: '#6B7280', bg: '#6B728015' };
  }
}

function getAccreditationBadge(statut: string) {
  switch (statut) {
    case 'actif': return { label: 'Actif', color: '#009460', bg: '#00946015' };
    case 'en_renouvellement': return { label: 'Renouvellement', color: '#FCD116', bg: '#FCD11615' };
    case 'expire': return { label: 'Expiré', color: '#CE1126', bg: '#CE112615' };
    case 'suspendu': return { label: 'Suspendu', color: '#6B7280', bg: '#6B728015' };
    default: return { label: statut, color: '#6B7280', bg: '#6B728015' };
  }
}

function getLangName(code: string): string {
  const lang = languages.find(l => l.code === code);
  return lang ? lang.name : code;
}

function getSuccessRateColor(rate: number): string {
  if (rate >= 70) return '#009460';
  if (rate >= 50) return '#FCD116';
  return '#CE1126';
}

function getQualityColor(score: number): string {
  if (score >= 90) return '#009460';
  if (score >= 70) return '#FCD116';
  return '#CE1126';
}

// ─── Sparkline component ──────────────────────────────
function Sparkline({ data, color, width = 80, height = 32 }: { data: number[]; color: string; width?: number; height?: number }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);

  const points = data.map((val, i) => {
    const x = i * step;
    const y = height - ((val - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── Custom Tooltip Component ───────────────────────────
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold mb-1" style={{ color: COLORS.primaryDark }}>{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
          <span style={{ color: '#6B7280' }}>{entry.name}:</span>
          <span className="font-semibold" style={{ color: COLORS.primaryDark }}>{entry.value.toLocaleString('fr-FR')}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Sidebar nav items ──────────────────────────────────
const sidebarItems = [
  { id: 'overview', label: 'Vue d\'ensemble', icon: LayoutDashboard },
  { id: 'analytics', label: 'Analyses', icon: BarChart3 },
  { id: 'fraud', label: 'Anti-fraude', icon: AlertOctagon },
  { id: 'centers', label: 'Centres', icon: Building2 },
  { id: 'settings', label: 'Paramètres', icon: Settings },
];

// ─── Component ──────────────────────────────────────────
export default function AdminDashboard({ onViewChange }: { onViewChange?: (view: ViewType) => void }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // ─── Data state ───────────────────────────────────────
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [kpi, setKpi] = useState<ApiKpi>({
    totalCandidates: 0,
    totalExams: 0,
    passedExams: 0,
    totalCentres: 0,
    totalRevenue: 0,
    avgSuccessRate: 0,
    activeFraudAlerts: 0,
  });
  const [monthlyExamData, setMonthlyExamData] = useState<ApiMonthlyVolume[]>([]);
  const [regionalStats, setRegionalStats] = useState<RegionalStat[]>([]);
  const [fraudAlerts, setFraudAlerts] = useState<FraudAlert[]>([]);
  const [fraudByCenter, setFraudByCenter] = useState<{ centre: string; alertes: number }[]>([]);
  const [centresData, setCentresData] = useState<Centre[]>([]);
  const [categoryScores, setCategoryScores] = useState<ApiCategoryScore[]>([]);
  const [dailyExamVolume, setDailyExamVolume] = useState<{ date: string; examens: number; reussis: number }[]>([]);
  const [topCentres, setTopCentres] = useState<{ nom: string; region: string; score: number; taux: number }[]>([]);
  const [sparklineData, setSparklineData] = useState({
    candidates: [] as number[],
    exams: [] as number[],
    successRate: [] as number[],
    centres: [] as number[],
  });
  const [fraudBySeverity, setFraudBySeverity] = useState<ApiFraudBySeverity[]>([]);
  const [blacklistedCandidates, setBlacklistedCandidates] = useState<{ nom: string; id: string; raison: string; date: string }[]>([]);

  // ─── Fetch dashboard data ─────────────────────────────
  const fetchDashboardData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/stats');
      if (!res.ok) {
        throw new Error(`Erreur ${res.status}: ${res.statusText}`);
      }
      const data: ApiResponse = await res.json();

      // KPI
      setKpi(data.kpi);

      // Monthly exam volume
      setMonthlyExamData(data.monthlyExamVolume);

      // Regional stats
      setRegionalStats(data.regionalStats);

      // Fraud alerts — map API format to FraudAlert interface
      const mappedFraudAlerts: FraudAlert[] = (data.fraudAlerts || []).map((fa) => ({
        id: fa.id,
        type: fa.type,
        description: fa.description,
        severity: (fa.severity || 'medium') as FraudSeverity,
        status: (fa.status || 'active') as FraudAlert['status'],
        candidatId: fa.candidatId,
        centreId: fa.centreId,
        timestamp: fa.timestamp,
        details: fa.details ? (typeof fa.details === 'string' ? JSON.parse(fa.details) : fa.details) : undefined,
      }));
      setFraudAlerts(mappedFraudAlerts);

      // Fraud by center — derive from fraudAlerts
      const centreAlertMap: Record<string, number> = {};
      for (const fa of data.fraudAlerts || []) {
        const centreName = fa.centre?.nom || 'Inconnu';
        centreAlertMap[centreName] = (centreAlertMap[centreName] || 0) + 1;
      }
      setFraudByCenter(
        Object.entries(centreAlertMap)
          .map(([centre, alertes]) => ({ centre, alertes }))
          .sort((a, b) => b.alertes - a.alertes)
      );

      // Fraud by severity
      setFraudBySeverity(data.fraudBySeverity || []);

      // Centres — map API format to Centre interface
      const mappedCentres: Centre[] = (data.centres || []).map((c) => ({
        id: c.id,
        nom: c.nom,
        ville: c.ville,
        region: c.region,
        adresse: c.adresse,
        capacite: c.capacite,
        telephone: c.telephone,
        email: c.email,
        actif: c.actif,
        accreditation: {
          dateDebut: c.accredDateDebut || '',
          dateFin: c.accredDateFin || '',
          statut: (c.accredStatut || 'actif') as Centre['accreditation'] extends undefined ? never : NonNullable<Centre['accreditation']>['statut'],
          scoreQualite: Math.round(c.accredScore || 0),
        },
        equipements: c.equipements || [],
        languesDisponibles: (c.languesDisponibles || ['fr']) as NationalLanguage[],
      }));
      setCentresData(mappedCentres);

      // Category scores
      setCategoryScores(data.categoryScores || []);

      // Daily exam volume — map from dailyStats
      const mappedDaily = (data.dailyStats || [])
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((ds) => {
          const d = new Date(ds.date);
          const dayStr = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
          return { date: dayStr, examens: ds.exams, reussis: ds.passed };
        });
      setDailyExamVolume(mappedDaily);

      // Top centres — derive from centres data
      const top5 = [...(mappedCentres || [])]
        .filter(c => c.accreditation)
        .sort((a, b) => (b.accreditation?.scoreQualite || 0) - (a.accreditation?.scoreQualite || 0))
        .slice(0, 5)
        .map(c => ({
          nom: c.nom,
          region: c.region,
          score: c.accreditation?.scoreQualite || 0,
          taux: Math.round(c.accreditation?.scoreQualite ? c.accreditation.scoreQualite * 0.85 : 0),
        }));
      setTopCentres(top5);

      // Sparkline data — derive from dailyStats
      const recentStats = [...(data.dailyStats || [])]
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-6);
      setSparklineData({
        candidates: recentStats.map(s => s.exams),
        exams: recentStats.map(s => s.exams),
        successRate: recentStats.map(s => s.exams > 0 ? Math.round((s.passed / s.exams) * 100) : 0),
        centres: recentStats.map(() => data.kpi.totalCentres),
      });

      setError(null);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await fetchDashboardData();
      setIsLoading(false);
    };
    load();
  }, [fetchDashboardData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchDashboardData();
    setIsRefreshing(false);
  };

  const currentDate = new Date();
  const dateStr = currentDate.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = currentDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  // ─── Derived stats for fraud tab ──────────────────────
  const activeFraudCount = fraudAlerts.filter(a => a.status === 'active').length;
  const investigatingFraudCount = fraudAlerts.filter(a => a.status === 'investigating').length;

  // ─── Loading skeleton ─────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F0F2F5' }}>
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin mx-auto" style={{ color: COLORS.green }} />
          <div>
            <p className="text-lg font-semibold" style={{ color: COLORS.primaryDark }}>Chargement du tableau de bord</p>
            <p className="text-sm text-gray-500 mt-1">Récupération des données en temps réel...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#F0F2F5' }}>
      {/* ─── Sidebar ─── */}
      <aside
        className={`hidden lg:flex flex-col border-r bg-white transition-all duration-300 ${
          sidebarCollapsed ? 'w-16' : 'w-56'
        }`}
        style={{ borderColor: '#E5E7EB' }}
      >
        {/* Logo area */}
        <div className="h-14 flex items-center justify-between px-4 border-b" style={{ borderColor: '#E5E7EB' }}>
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: COLORS.green }}>
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-sm" style={{ color: COLORS.primaryDark }}>Admin</span>
            </div>
          )}
          <button
            className="p-1 rounded hover:bg-gray-100 transition-colors"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${sidebarCollapsed ? 'rotate-90' : '-rotate-90'}`} />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-3 px-2 space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
                style={isActive ? { backgroundColor: COLORS.green } : {}}
                onClick={() => setActiveTab(item.id)}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Bottom section */}
        {!sidebarCollapsed && (
          <div className="p-4 border-t" style={{ borderColor: '#E5E7EB' }}>
            <div className="rounded-xl p-3" style={{ backgroundColor: '#F0F7F4' }}>
              <p className="text-xs font-semibold" style={{ color: COLORS.green }}>République de Guinée</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Ministère des Transports</p>
            </div>
          </div>
        )}
      </aside>

      {/* ─── Main Content ─── */}
      <main className="flex-1 min-w-0">
        {/* Guinea stripe */}
        <div className="w-full h-0.5 flex">
          <div className="flex-1" style={{ backgroundColor: COLORS.red }} />
          <div className="flex-1" style={{ backgroundColor: COLORS.yellow }} />
          <div className="flex-1" style={{ backgroundColor: COLORS.green }} />
        </div>

        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* ─── Breadcrumb ─── */}
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
            <span>Administration</span>
            <ChevronRight className="w-3 h-3" />
            <span className="font-medium text-gray-700">
              {sidebarItems.find(s => s.id === activeTab)?.label || 'Vue d\'ensemble'}
            </span>
          </div>

          {/* ─── Header Section ─── */}
          <div className="mb-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold tracking-tight" style={{ color: COLORS.primaryDark }}>
                  Administration nationale
                </h1>
                <div className="flex items-center gap-3 mt-1.5">
                  <Badge className="px-3 py-1 text-xs font-semibold" style={{ backgroundColor: COLORS.primaryDark, color: '#FFFFFF' }}>
                    <Shield className="w-3.5 h-3.5 mr-1.5" />
                    Administrateur
                  </Badge>
                  <Badge variant="outline" className="px-3 py-1 text-xs font-medium" style={{ borderColor: COLORS.green, color: COLORS.green }}>
                    <Activity className="w-3.5 h-3.5 mr-1.5" />
                    En ligne
                  </Badge>
                  <span className="text-xs text-gray-400 hidden sm:inline">
                    <Clock className="w-3 h-3 inline mr-1" />
                    {dateStr} — {timeStr}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="text-xs gap-1.5 h-8" style={{ borderColor: COLORS.primaryDark, color: COLORS.primaryDark }}>
                  <FileDown className="w-3.5 h-3.5" />
                  Exporter
                </Button>
                <Button variant="outline" size="sm" className="text-xs gap-1.5 h-8" style={{ borderColor: COLORS.green, color: COLORS.green }} onClick={handleRefresh} disabled={isRefreshing}>
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Actualiser
                </Button>
              </div>
            </div>
          </div>

          {/* ─── Error banner ─── */}
          {error && (
            <Card className="border-0 shadow-sm mb-4" style={{ backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' }}>
              <CardContent className="p-4 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" style={{ color: COLORS.red }} />
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: COLORS.red }}>Erreur de chargement</p>
                  <p className="text-xs text-gray-600">{error}</p>
                </div>
                <Button variant="outline" size="sm" className="text-xs h-7" onClick={handleRefresh} disabled={isRefreshing}>
                  <RefreshCw className={`w-3 h-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Réessayer
                </Button>
              </CardContent>
            </Card>
          )}

          {/* ─── KPI Stats Row with Sparklines ─── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { title: 'Candidats inscrits', value: kpi.totalCandidates.toLocaleString('fr-FR'), icon: Users, color: COLORS.green, bgColor: '#00946012', sparkData: sparklineData.candidates, sparkColor: COLORS.green },
              { title: 'Centres agréés', value: kpi.totalCentres.toLocaleString('fr-FR'), icon: Building2, color: COLORS.yellow, bgColor: '#FCD11612', sparkData: sparklineData.centres, sparkColor: COLORS.yellow },
              { title: 'Examens total', value: kpi.totalExams.toLocaleString('fr-FR'), icon: FileCheck, color: COLORS.red, bgColor: '#CE112612', sparkData: sparklineData.exams, sparkColor: COLORS.red },
              { title: 'Taux de réussite', value: `${kpi.avgSuccessRate}%`, icon: TrendingUp, color: COLORS.primaryDark, bgColor: '#1A233212', sparkData: sparklineData.successRate, sparkColor: COLORS.primaryDark },
            ].map((stat, i) => (
              <Card key={i} className="border-0 shadow-sm hover:shadow-md transition-shadow bg-white">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-xs font-medium uppercase tracking-wider" style={{ color: '#9CA3AF' }}>{stat.title}</p>
                      <div className="flex items-end gap-3 mt-1">
                        <p className="text-3xl font-bold" style={{ color: COLORS.primaryDark }}>{stat.value}</p>
                        {stat.sparkData.length >= 2 && <Sparkline data={stat.sparkData} color={stat.sparkColor} />}
                      </div>
                    </div>
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: stat.bgColor }}>
                      <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* ─── Tabbed Content ─── */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            {/* Mobile tabs (visible on small screens) */}
            <TabsList className="bg-white shadow-sm border-0 h-11 p-1 rounded-lg lg:hidden flex flex-wrap">
              {sidebarItems.map(item => (
                <TabsTrigger
                  key={item.id}
                  value={item.id}
                  className="text-xs font-medium px-3 data-[state=active]:shadow-sm rounded-md data-[state=active]:text-white"
                  style={{ color: COLORS.primaryDark }}
                >
                  <item.icon className="w-3.5 h-3.5 mr-1" />
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* ═══════ TAB 1: Vue d'ensemble ═══════ */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Monthly Exam Trends LineChart */}
                <Card className="border-0 shadow-sm bg-white lg:col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: COLORS.primaryDark }}>
                      <TrendingUp className="w-4 h-4" style={{ color: COLORS.green }} />
                      Tendances des examens mensuels
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="h-72">
                      {monthlyExamData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={monthlyExamData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={{ stroke: '#E5E7EB' }} />
                            <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={{ stroke: '#E5E7EB' }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                            <Line type="monotone" dataKey="totalExamens" name="Total examens" stroke={COLORS.green} strokeWidth={2.5} dot={{ r: 4, fill: COLORS.green }} activeDot={{ r: 6 }} />
                            <Line type="monotone" dataKey="reussis" name="Réussis" stroke={COLORS.yellow} strokeWidth={2.5} dot={{ r: 4, fill: COLORS.yellow }} activeDot={{ r: 6 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                          <BarChart3 className="w-10 h-10 mb-2" />
                          <p className="text-sm">Aucune donnée mensuelle disponible</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Language Distribution */}
                <Card className="border-0 shadow-sm bg-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: COLORS.primaryDark }}>
                      <Globe className="w-4 h-4" style={{ color: COLORS.green }} />
                      Langue de l&apos;examen
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="h-56 flex flex-col items-center justify-center">
                      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: '#E6F5EE' }}>
                        <Globe className="w-10 h-10" style={{ color: COLORS.green }} />
                      </div>
                      <p className="text-2xl font-bold" style={{ color: COLORS.primaryDark }}>Français</p>
                      <p className="text-sm text-gray-500 mt-1">100% des examens</p>
                      <p className="text-xs text-gray-400 mt-3">Soussou, Poular, Malinké — bientôt disponible</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Regional Stats Table */}
              <Card className="border-0 shadow-sm bg-white">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: COLORS.primaryDark }}>
                      <MapPin className="w-4 h-4" style={{ color: COLORS.red }} />
                      Statistiques régionales
                    </CardTitle>
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1" style={{ borderColor: COLORS.green, color: COLORS.green }}>
                      <Download className="w-3 h-3" />
                      CSV
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {regionalStats.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b" style={{ borderColor: '#E5E7EB' }}>
                            <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Région</th>
                            <th className="text-center py-3 px-4 text-xs font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Centres</th>
                            <th className="text-right py-3 px-4 text-xs font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Candidats</th>
                            <th className="text-right py-3 px-4 text-xs font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Réussis</th>
                            <th className="text-center py-3 px-4 text-xs font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Taux</th>
                            <th className="text-right py-3 px-4 text-xs font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Revenus</th>
                          </tr>
                        </thead>
                        <tbody>
                          {regionalStats.map((row, i) => (
                            <tr key={row.region} className={`border-b last:border-0 hover:bg-gray-50/50 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`} style={{ borderColor: '#F3F4F6' }}>
                              <td className="py-3 px-4 font-medium" style={{ color: COLORS.primaryDark }}>{row.region}</td>
                              <td className="py-3 px-4 text-center">
                                <Badge variant="outline" className="text-xs font-medium" style={{ borderColor: '#E5E7EB', color: COLORS.primaryDark }}>{row.centres}</Badge>
                              </td>
                              <td className="py-3 px-4 text-right font-mono text-xs" style={{ color: '#6B7280' }}>{row.candidates.toLocaleString('fr-FR')}</td>
                              <td className="py-3 px-4 text-right font-mono text-xs" style={{ color: '#6B7280' }}>{row.examsPassed.toLocaleString('fr-FR')}</td>
                              <td className="py-3 px-4 text-center">
                                <span className="text-sm font-bold" style={{ color: getSuccessRateColor(row.successRate) }}>{row.successRate}%</span>
                              </td>
                              <td className="py-3 px-4 text-right font-mono text-xs" style={{ color: '#6B7280' }}>{formatCurrency(row.revenue)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="py-12 text-center text-gray-400">
                      <MapPin className="w-10 h-10 mx-auto mb-2" />
                      <p className="text-sm">Aucune donnée régionale disponible</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ═══════ TAB 2: Anti-fraude ═══════ */}
            <TabsContent value="fraud" className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Alertes actives', value: activeFraudCount.toString(), icon: AlertTriangle, color: COLORS.red, bg: '#CE112612' },
                  { label: 'En investigation', value: investigatingFraudCount.toString(), icon: Search, color: COLORS.yellow, bg: '#FCD11612' },
                  { label: 'Total alertes', value: kpi.activeFraudAlerts.toString(), icon: CheckCircle, color: COLORS.green, bg: '#00946012' },
                ].map((s, i) => (
                  <Card key={i} className="border-0 shadow-sm bg-white">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: s.bg }}>
                        <s.icon className="w-5 h-5" style={{ color: s.color }} />
                      </div>
                      <div>
                        <p className="text-xs" style={{ color: '#9CA3AF' }}>{s.label}</p>
                        <p className="text-2xl font-bold" style={{ color: COLORS.primaryDark }}>{s.value}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                {/* Fraud Alert Data Table */}
                <Card className="border-0 shadow-sm bg-white lg:col-span-3">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: COLORS.primaryDark }}>
                        <CircleAlert className="w-4 h-4" style={{ color: COLORS.red }} />
                        Flux d&apos;alertes en temps réel
                      </CardTitle>
                      <div className="flex items-center gap-1.5">
                        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" style={{ color: '#6B7280' }}>
                          <Filter className="w-3 h-3" />
                          Filtrer
                        </Button>
                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" style={{ borderColor: COLORS.green, color: COLORS.green }}>
                          <Download className="w-3 h-3" />
                          Export
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {/* Data table style */}
                    {fraudAlerts.length > 0 ? (
                      <div className="overflow-x-auto max-h-96 overflow-y-auto">
                        <table className="w-full text-sm">
                          <thead className="sticky top-0 bg-white">
                            <tr className="border-b" style={{ borderColor: '#E5E7EB' }}>
                              <th className="text-left py-2 px-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Type</th>
                              <th className="text-left py-2 px-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Sévérité</th>
                              <th className="text-left py-2 px-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Statut</th>
                              <th className="text-left py-2 px-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Heure</th>
                              <th className="text-center py-2 px-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {fraudAlerts.map((alert) => {
                              const sev = getSeverityConfig(alert.severity);
                              const stat = getStatusConfig(alert.status);
                              return (
                                <tr key={alert.id} className="border-b last:border-0 hover:bg-gray-50/50" style={{ borderColor: '#F3F4F6' }}>
                                  <td className="py-2.5 px-3">
                                    <div>
                                      <p className="text-xs font-semibold" style={{ color: COLORS.primaryDark }}>{alert.type}</p>
                                      <p className="text-[10px] text-gray-400 truncate max-w-[200px]">{alert.description}</p>
                                    </div>
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <Badge className="text-[10px] px-1.5 py-0 h-4 font-semibold" style={{ backgroundColor: sev.bg, color: sev.color, borderColor: sev.color, borderWidth: 1 }}>
                                      {sev.label}
                                    </Badge>
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-medium" style={{ backgroundColor: stat.bg, color: stat.color, borderColor: stat.color }}>
                                      {stat.label}
                                    </Badge>
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <span className="text-[10px] text-gray-400">{formatTimestamp(alert.timestamp)}</span>
                                  </td>
                                  <td className="py-2.5 px-3 text-center">
                                    <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" style={{ color: COLORS.primaryDark }}>
                                      <Eye className="w-3 h-3" />
                                    </Button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="py-12 text-center text-gray-400">
                        <CheckCircle className="w-10 h-10 mx-auto mb-2" />
                        <p className="text-sm">Aucune alerte de fraude active</p>
                        <p className="text-xs mt-1">Le système est clean</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="lg:col-span-2 space-y-4">
                  <Card className="border-0 shadow-sm bg-white">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: COLORS.primaryDark }}>
                        <BarChart3 className="w-4 h-4" style={{ color: COLORS.red }} />
                        Alertes par centre
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="h-52">
                        {fraudByCenter.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={fraudByCenter} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                              <XAxis dataKey="centre" tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                              <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                              <Tooltip content={<CustomTooltip />} />
                              <Bar dataKey="alertes" name="Alertes" radius={[4, 4, 0, 0]}>
                                {fraudByCenter.map((_, index) => (
                                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <BarChart3 className="w-8 h-8 mb-2" />
                            <p className="text-xs">Aucune donnée</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-sm bg-white">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: COLORS.primaryDark }}>
                        <Ban className="w-4 h-4" style={{ color: COLORS.red }} />
                        Liste noire
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {blacklistedCandidates.length > 0 ? (
                        <div className="space-y-2">
                          {blacklistedCandidates.map((c, i) => (
                            <div key={i} className="p-2.5 rounded-lg border" style={{ borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' }}>
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-xs font-semibold" style={{ color: COLORS.primaryDark }}>{c.nom}</p>
                                  <p className="text-[10px] font-mono" style={{ color: '#9CA3AF' }}>{c.id}</p>
                                </div>
                                <Badge className="text-[10px] px-1.5 h-4 bg-red-100 text-red-700 hover:bg-red-100">Banni</Badge>
                              </div>
                              <p className="text-[10px] mt-1" style={{ color: '#6B7280' }}>{c.raison}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-8 text-center text-gray-400">
                          <Ban className="w-8 h-8 mx-auto mb-2" />
                          <p className="text-xs">Aucun candidat sur liste noire</p>
                          <p className="text-[10px] mt-1">Données non disponibles via l&apos;API</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* ═══════ TAB 3: Centres ═══════ */}
            <TabsContent value="centers" className="space-y-4">
              <Card className="border-0 shadow-sm bg-white">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: COLORS.primaryDark }}>
                      <Building2 className="w-4 h-4" style={{ color: COLORS.yellow }} />
                      Gestion des centres agréés
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1" style={{ borderColor: COLORS.green, color: COLORS.green }}>
                        <Download className="w-3 h-3" />
                        Export
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {centresData.length > 0 ? (
                    <div className="overflow-x-auto max-h-96 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-white">
                          <tr className="border-b" style={{ borderColor: '#E5E7EB' }}>
                            <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Centre</th>
                            <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Région</th>
                            <th className="text-center py-3 px-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Capacité</th>
                            <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Qualité</th>
                            <th className="text-center py-3 px-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Accréditation</th>
                            <th className="text-center py-3 px-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Statut</th>
                          </tr>
                        </thead>
                        <tbody>
                          {centresData.map((centre, i) => {
                            const accred = centre.accreditation;
                            const accredBadge = accred ? getAccreditationBadge(accred.statut) : null;
                            const qualityColor = accred ? getQualityColor(accred.scoreQualite) : '#6B7280';
                            return (
                              <tr key={centre.id} className={`border-b last:border-0 hover:bg-gray-50/50 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`} style={{ borderColor: '#F3F4F6' }}>
                                <td className="py-3 px-3">
                                  <div>
                                    <p className="font-medium text-sm" style={{ color: COLORS.primaryDark }}>{centre.nom}</p>
                                    <p className="text-[10px] flex items-center gap-1 mt-0.5" style={{ color: '#9CA3AF' }}>
                                      <MapPin className="w-3 h-3" />{centre.adresse}
                                    </p>
                                  </div>
                                </td>
                                <td className="py-3 px-3 text-xs" style={{ color: '#6B7280' }}>{centre.region}</td>
                                <td className="py-3 px-3 text-center text-xs font-medium" style={{ color: COLORS.primaryDark }}>{centre.capacite}</td>
                                <td className="py-3 px-3">
                                  {accred ? (
                                    <div className="flex items-center gap-2">
                                      <Progress value={accred.scoreQualite} className="h-2 flex-1" />
                                      <span className="text-xs font-bold w-8 text-right" style={{ color: qualityColor }}>{accred.scoreQualite}</span>
                                    </div>
                                  ) : <span className="text-xs" style={{ color: '#9CA3AF' }}>N/A</span>}
                                </td>
                                <td className="py-3 px-3 text-center">
                                  {accredBadge ? (
                                    <Badge className="text-[10px] px-1.5 py-0 h-5 font-semibold" style={{ backgroundColor: accredBadge.bg, color: accredBadge.color }}>
                                      {accredBadge.label}
                                    </Badge>
                                  ) : <span className="text-xs" style={{ color: '#9CA3AF' }}>N/A</span>}
                                </td>
                                <td className="py-3 px-3 text-center">
                                  {centre.actif ? (
                                    <Badge className="text-[10px] px-1.5 py-0 h-5 font-semibold bg-green-50 text-green-700 hover:bg-green-50">
                                      <CheckCircle className="w-3 h-3 mr-0.5" />Actif
                                    </Badge>
                                  ) : (
                                    <Badge className="text-[10px] px-1.5 py-0 h-5 font-semibold bg-red-50 text-red-700 hover:bg-red-50">
                                      <XCircle className="w-3 h-3 mr-0.5" />Inactif
                                    </Badge>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="py-12 text-center text-gray-400">
                      <Building2 className="w-10 h-10 mx-auto mb-2" />
                      <p className="text-sm">Aucun centre agréé trouvé</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ═══════ TAB 4: Analyses ═══════ */}
            <TabsContent value="analytics" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="border-0 shadow-sm bg-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: COLORS.primaryDark }}>
                      <Activity className="w-4 h-4" style={{ color: COLORS.green }} />
                      Volume d&apos;examens (30 jours)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="h-64">
                      {dailyExamVolume.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={dailyExamVolume} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                            <defs>
                              <linearGradient id="colorExamens" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={COLORS.green} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={COLORS.green} stopOpacity={0} />
                              </linearGradient>
                              <linearGradient id="colorReussis" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={COLORS.yellow} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={COLORS.yellow} stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                            <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#9CA3AF' }} interval={4} />
                            <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                            <Area type="monotone" dataKey="examens" name="Examens" stroke={COLORS.green} strokeWidth={2} fillOpacity={1} fill="url(#colorExamens)" />
                            <Area type="monotone" dataKey="reussis" name="Réussis" stroke={COLORS.yellow} strokeWidth={2} fillOpacity={1} fill="url(#colorReussis)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                          <Activity className="w-10 h-10 mb-2" />
                          <p className="text-sm">Aucune donnée quotidienne disponible</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: COLORS.primaryDark }}>
                      <Globe className="w-4 h-4" style={{ color: COLORS.green }} />
                      Taux de réussite global
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="h-64 flex flex-col items-center justify-center">
                      <div className="relative w-32 h-32">
                        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                          <circle cx="50" cy="50" r="40" fill="none" stroke="#E5E7EB" strokeWidth="8" />
                          <circle cx="50" cy="50" r="40" fill="none" stroke={kpi.avgSuccessRate >= 70 ? COLORS.green : kpi.avgSuccessRate >= 50 ? COLORS.yellow : COLORS.red} strokeWidth="8" strokeDasharray={`${kpi.avgSuccessRate * 2.51} ${100 * 2.51}`} strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-2xl font-bold" style={{ color: COLORS.primaryDark }}>{kpi.avgSuccessRate}%</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mt-4">Taux de réussite en français</p>
                      <p className="text-xs text-gray-400 mt-1">Les langues nationales seront bientôt disponibles</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="border-0 shadow-sm bg-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: COLORS.primaryDark }}>
                      <FileCheck className="w-4 h-4" style={{ color: COLORS.green }} />
                      Score moyen par catégorie
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {categoryScores.length > 0 ? (
                      <div className="space-y-3">
                        {categoryScores.map((cat) => {
                          const scoreColor = cat.score >= 80 ? COLORS.green : cat.score >= 70 ? COLORS.yellow : COLORS.red;
                          return (
                            <div key={cat.categorie} className="flex items-center gap-3">
                              <span className="text-xs w-28 flex-shrink-0 font-medium" style={{ color: COLORS.primaryDark }}>{cat.categorie}</span>
                              <div className="flex-1"><Progress value={cat.score} className="h-2.5" /></div>
                              <span className="text-xs font-bold w-10 text-right" style={{ color: scoreColor }}>{cat.score}%</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-12 text-center text-gray-400">
                        <FileCheck className="w-10 h-10 mx-auto mb-2" />
                        <p className="text-sm">Aucune donnée de catégorie disponible</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: COLORS.primaryDark }}>
                      <TrendingUp className="w-4 h-4" style={{ color: COLORS.yellow }} />
                      Top centres
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {topCentres.length > 0 ? (
                      <div className="space-y-2">
                        {topCentres.map((c, i) => (
                          <div key={c.nom} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50/50 transition-colors">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${i === 0 ? 'text-white' : ''}`} style={{
                              backgroundColor: i === 0 ? COLORS.yellow : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : '#E5E7EB',
                              color: i === 0 ? COLORS.primaryDark : i < 3 ? '#FFFFFF' : '#6B7280'
                            }}>
                              {i + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold truncate" style={{ color: COLORS.primaryDark }}>{c.nom}</p>
                              <p className="text-[10px]" style={{ color: '#9CA3AF' }}>{c.region} — Score: {c.score}/100</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-sm font-bold" style={{ color: getSuccessRateColor(c.taux) }}>{c.taux}%</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-12 text-center text-gray-400">
                        <Building2 className="w-10 h-10 mx-auto mb-2" />
                        <p className="text-sm">Aucun centre à afficher</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ═══════ TAB 5: Settings ═══════ */}
            <TabsContent value="settings" className="space-y-4">
              <Card className="border-0 shadow-sm bg-white">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold" style={{ color: COLORS.primaryDark }}>Paramètres du système</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-semibold mb-2" style={{ color: COLORS.primaryDark }}>Paramètres généraux</h3>
                      <Separator className="mb-4" />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Nom de l&apos;organisation</p>
                          <p className="text-sm font-medium" style={{ color: COLORS.primaryDark }}>CodeRoute Guinée</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Ministère de tutelle</p>
                          <p className="text-sm font-medium" style={{ color: COLORS.primaryDark }}>Ministère des Transports</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Durée de l&apos;examen</p>
                          <p className="text-sm font-medium" style={{ color: COLORS.primaryDark }}>30 minutes</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Score de réussite</p>
                          <p className="text-sm font-medium" style={{ color: COLORS.primaryDark }}>35/40 (87.5%)</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold mb-2" style={{ color: COLORS.primaryDark }}>Langues supportées</h3>
                      <Separator className="mb-4" />
                      <div className="flex flex-wrap gap-2">
                        {languages.map(lang => (
                          <Badge key={lang.code} variant="outline" className="text-xs px-3 py-1" style={{ borderColor: COLORS.green, color: COLORS.green }}>
                            {lang.name} ({lang.nativeName})
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
