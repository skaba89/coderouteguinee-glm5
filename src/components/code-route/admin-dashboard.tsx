'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ViewType, FraudAlert, FraudSeverity, RegionalStat } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { centres, languages } from '@/lib/mock-data';
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
} from 'lucide-react';

// ─── Color Palette ──────────────────────────────────────
const COLORS = {
  primaryDark: '#1A2332',
  red: '#CE1126',
  yellow: '#FCD116',
  green: '#009460',
};

const CHART_COLORS = ['#009460', '#FCD116', '#CE1126', '#1A2332', '#7C3AED', '#0EA5E9'];

// ─── Mock Data ──────────────────────────────────────────
const monthlyExamData = [
  { month: 'Jan', totalExamens: 3200, reussis: 2100 },
  { month: 'Fév', totalExamens: 2800, reussis: 1900 },
  { month: 'Mar', totalExamens: 3500, reussis: 2400 },
  { month: 'Avr', totalExamens: 3100, reussis: 2050 },
  { month: 'Mai', totalExamens: 3900, reussis: 2650 },
  { month: 'Jun', totalExamens: 4200, reussis: 2900 },
];

const regionalStats: RegionalStat[] = [
  { region: 'Conakry', centres: 3, candidates: 22150, examsPassed: 16200, successRate: 73, revenue: 445000000 },
  { region: 'Kankan', centres: 1, candidates: 8200, examsPassed: 5340, successRate: 65, revenue: 168000000 },
  { region: 'Nzérékoré', centres: 1, candidates: 5800, examsPassed: 3480, successRate: 60, revenue: 116000000 },
  { region: 'Kindia', centres: 1, candidates: 6100, examsPassed: 3906, successRate: 64, revenue: 122000000 },
  { region: 'Boké', centres: 1, candidates: 4200, examsPassed: 2180, successRate: 52, revenue: 84000000 },
  { region: 'Labé', centres: 0, candidates: 3400, examsPassed: 2040, successRate: 60, revenue: 68000000 },
  { region: 'Mamou', centres: 0, candidates: 2497, examsPassed: 1374, successRate: 55, revenue: 49900000 },
];

const languageDistribution = [
  { name: 'Français', value: 45 },
  { name: 'Soussou', value: 22 },
  { name: 'Poular', value: 20 },
  { name: 'Malinké', value: 13 },
];
const LANGUAGE_PIE_COLORS = ['#1A2332', '#009460', '#CE1126', '#FCD116'];

const fraudAlerts: FraudAlert[] = [
  { id: 'FRD-001', type: 'Identité suspecte', description: 'Photo du candidat GN-CODE-2026-789012 ne correspond pas à la pièce d\'identité présentée', severity: 'critical', status: 'active', candidatId: 'GN-CODE-2026-789012', centreId: 'CTR-001', timestamp: '2026-03-04T14:32:00' },
  { id: 'FRD-002', type: 'Comportement anormal', description: 'Temps de réponse moyen de 3.2s — seuil normal: 8-15s au centre de Dixinn', severity: 'high', status: 'investigating', candidatId: 'GN-CODE-2026-456789', centreId: 'CTR-002', timestamp: '2026-03-04T12:15:00' },
  { id: 'FRD-003', type: 'Double inscription', description: 'Même numéro d\'identité GN-ID-99887766 détecté dans les centres CTR-001 et CTR-004', severity: 'critical', status: 'active', timestamp: '2026-03-04T09:45:00' },
  { id: 'FRD-004', type: 'Photo non conforme', description: 'Image webcam floue — impossible de vérifier l\'identité du candidat au centre de Matam', severity: 'medium', status: 'investigating', centreId: 'CTR-003', timestamp: '2026-03-04T08:20:00' },
  { id: 'FRD-005', type: 'Temps de réponse anormal', description: 'Candidat a répondu à 15 questions en 45 secondes — motif de triche probable', severity: 'high', status: 'active', candidatId: 'GN-CODE-2026-321654', centreId: 'CTR-001', timestamp: '2026-03-03T16:50:00' },
  { id: 'FRD-006', type: 'Identité suspecte', description: 'Candidat signalé par le surveillant — ressemblance avec un candidat banni', severity: 'medium', status: 'resolved', candidatId: 'GN-CODE-2026-111222', centreId: 'CTR-004', timestamp: '2026-03-03T10:30:00' },
  { id: 'FRD-007', type: 'Comportement anormal', description: 'Mouvements de tête suspects détectés par la webcam — regard repeté hors écran', severity: 'low', status: 'resolved', candidatId: 'GN-CODE-2026-987654', centreId: 'CTR-002', timestamp: '2026-03-02T14:10:00' },
];

const fraudByCenter = [
  { centre: 'Kaloum', alertes: 8 },
  { centre: 'Dixinn', alertes: 5 },
  { centre: 'Matam', alertes: 3 },
  { centre: 'Kankan', alertes: 4 },
  { centre: 'Nzérékoré', alertes: 2 },
  { centre: 'Kindia', alertes: 6 },
  { centre: 'Boké', alertes: 1 },
];

const blacklistedCandidates = [
  { nom: 'Diallo A.', id: 'GN-CODE-2025-445566', raison: 'Falsification d\'identité', date: '2026-01-15' },
  { nom: 'Touré M.', id: 'GN-CODE-2025-778899', raison: 'Tentative de fraude organisée', date: '2026-02-03' },
  { nom: 'Camara S.', id: 'GN-CODE-2025-112233', raison: 'Double inscription récurrente', date: '2026-02-20' },
];

// Daily exam volume (last 30 days mock)
const dailyExamVolume = Array.from({ length: 30 }, (_, i) => {
  const day = i + 1;
  const base = 120 + Math.floor(Math.sin(i * 0.5) * 30);
  const volume = base + Math.floor(Math.random() * 40);
  const passed = Math.floor(volume * (0.6 + Math.random() * 0.15));
  return {
    date: `Mar ${day}`,
    examens: volume,
    reussis: passed,
  };
});

// Success rates by language
const successByLanguage = [
  { langue: 'Français', taux: 71 },
  { langue: 'Soussou', taux: 58 },
  { langue: 'Poular', taux: 54 },
  { langue: 'Malinké', taux: 62 },
];

// Average scores by category
const categoryScores = [
  { categorie: 'Signalisation', score: 78 },
  { categorie: 'Sécurité', score: 85 },
  { categorie: 'Priorité', score: 62 },
  { categorie: 'Réglementation', score: 70 },
  { categorie: 'Vitesse', score: 88 },
  { categorie: 'Stationnement', score: 72 },
];

// Top centres leaderboard
const topCentres = [
  { nom: 'Centre RouteSafe Kaloum', region: 'Conakry', score: 92, taux: 78 },
  { nom: 'Centre Auto-Plus Dixinn', region: 'Conakry', score: 88, taux: 73 },
  { nom: 'Centre Permis Kankan', region: 'Kankan', score: 85, taux: 70 },
  { nom: 'Centre Routier Nzérékoré', region: 'Nzérékoré', score: 80, taux: 65 },
  { nom: 'Centre Auto-École Kindia', region: 'Kindia', score: 78, taux: 64 },
];

// ─── Helpers ────────────────────────────────────────────
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-GN').format(amount) + ' GNF';
}

function formatTimestamp(ts: string): string {
  const d = new Date(ts);
  const now = new Date('2026-03-04T15:00:00');
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

// ─── Component ──────────────────────────────────────────
export default function AdminDashboard({ onViewChange }: { onViewChange?: (view: ViewType) => void }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  const currentDate = new Date('2026-03-04T15:00:00');
  const dateStr = currentDate.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = currentDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F0F2F5' }}>
      {/* ─── Guinea Flag Accent Line ─── */}
      <div className="w-full h-1 flex">
        <div className="flex-1" style={{ backgroundColor: COLORS.red }} />
        <div className="flex-1" style={{ backgroundColor: COLORS.yellow }} />
        <div className="flex-1" style={{ backgroundColor: COLORS.green }} />
      </div>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* ─── Header Section ─── */}
        <div className="mb-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center gap-4">
              {/* Republic Seal */}
              <div className="w-14 h-14 rounded-full flex items-center justify-center border-2 flex-shrink-0" style={{ borderColor: COLORS.primaryDark, backgroundColor: '#FFFFFF' }}>
                <div className="text-center">
                  <Shield className="w-7 h-7" style={{ color: COLORS.primaryDark }} />
                </div>
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold tracking-tight" style={{ color: COLORS.primaryDark }}>
                  Administration nationale
                </h1>
                <p className="text-sm mt-0.5" style={{ color: '#6B7280' }}>
                  République de Guinée — Code de la Route
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <Badge className="px-3 py-1.5 text-xs font-semibold" style={{ backgroundColor: COLORS.primaryDark, color: '#FFFFFF' }}>
                  <Shield className="w-3.5 h-3.5 mr-1.5" />
                  Administrateur Système
                </Badge>
                <Badge variant="outline" className="px-3 py-1.5 text-xs font-medium" style={{ borderColor: COLORS.green, color: COLORS.green }}>
                  <Activity className="w-3.5 h-3.5 mr-1.5" />
                  En ligne
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="text-xs gap-1.5 h-8" style={{ borderColor: COLORS.primaryDark, color: COLORS.primaryDark }}>
                  <Download className="w-3.5 h-3.5" />
                  Exporter
                </Button>
                <Button variant="outline" size="sm" className="text-xs gap-1.5 h-8" style={{ borderColor: COLORS.green, color: COLORS.green }} onClick={handleRefresh} disabled={isRefreshing}>
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Actualiser
                </Button>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3 text-xs" style={{ color: '#9CA3AF' }}>
            <Clock className="w-3.5 h-3.5" />
            <span>{dateStr} — {timeStr} GMT</span>
          </div>
        </div>

        {/* ─── KPI Stats Row ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { title: 'Candidats inscrits', value: '52 347', trend: '+12.5%', trendUp: true, icon: Users, color: COLORS.green, bgColor: '#00946012' },
            { title: 'Centres agréés', value: '15', subtitle: '2 en attente', icon: Building2, color: COLORS.yellow, bgColor: '#FCD11612' },
            { title: 'Examens ce mois', value: '4 200', trend: '+8.3%', trendUp: true, icon: FileCheck, color: COLORS.red, bgColor: '#CE112612' },
            { title: 'Taux de réussite', value: '67%', trend: '-2.1%', trendUp: false, icon: TrendingUp, color: COLORS.primaryDark, bgColor: '#1A233212' },
          ].map((stat, i) => (
            <Card key={i} className="border-0 shadow-sm hover:shadow-md transition-shadow bg-white">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-medium uppercase tracking-wider" style={{ color: '#9CA3AF' }}>{stat.title}</p>
                    <p className="text-3xl font-bold mt-1" style={{ color: COLORS.primaryDark }}>{stat.value}</p>
                    {stat.trend && (
                      <div className="flex items-center gap-1 mt-1.5">
                        {stat.trendUp ? (
                          <TrendingUp className="w-3.5 h-3.5" style={{ color: COLORS.green }} />
                        ) : (
                          <TrendingUp className="w-3.5 h-3.5 rotate-180" style={{ color: COLORS.red }} />
                        )}
                        <span className="text-xs font-semibold" style={{ color: stat.trendUp ? COLORS.green : COLORS.red }}>
                          {stat.trend}
                        </span>
                      </div>
                    )}
                    {stat.subtitle && (
                      <p className="text-xs mt-1.5" style={{ color: '#9CA3AF' }}>{stat.subtitle}</p>
                    )}
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
          <TabsList className="bg-white shadow-sm border-0 h-11 p-1 rounded-lg">
            <TabsTrigger value="overview" className="text-xs font-medium px-4 data-[state=active]:shadow-sm rounded-md data-[state=active]:text-white" style={{ color: COLORS.primaryDark }}>
              <BarChart3 className="w-4 h-4 mr-1.5" />
              Vue d&apos;ensemble
            </TabsTrigger>
            <TabsTrigger value="fraud" className="text-xs font-medium px-4 data-[state=active]:shadow-sm rounded-md data-[state=active]:text-white" style={{ color: COLORS.primaryDark }}>
              <AlertOctagon className="w-4 h-4 mr-1.5" />
              Anti-fraude
            </TabsTrigger>
            <TabsTrigger value="centers" className="text-xs font-medium px-4 data-[state=active]:shadow-sm rounded-md data-[state=active]:text-white" style={{ color: COLORS.primaryDark }}>
              <Building2 className="w-4 h-4 mr-1.5" />
              Centres
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs font-medium px-4 data-[state=active]:shadow-sm rounded-md data-[state=active]:text-white" style={{ color: COLORS.primaryDark }}>
              <Activity className="w-4 h-4 mr-1.5" />
              Analyses
            </TabsTrigger>
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
                  </div>
                </CardContent>
              </Card>

              {/* Language Distribution PieChart */}
              <Card className="border-0 shadow-sm bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: COLORS.primaryDark }}>
                    <Globe className="w-4 h-4" style={{ color: COLORS.primaryDark }} />
                    Répartition linguistique
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={languageDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={3}
                          dataKey="value"
                          stroke="none"
                        >
                          {languageDistribution.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={LANGUAGE_PIE_COLORS[index]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => [`${value}%`, '']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {languageDistribution.map((lang, i) => (
                      <div key={lang.name} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: LANGUAGE_PIE_COLORS[i] }} />
                        <span className="text-xs" style={{ color: '#6B7280' }}>{lang.name}</span>
                        <span className="text-xs font-semibold ml-auto" style={{ color: COLORS.primaryDark }}>{lang.value}%</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Regional Stats Table */}
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: COLORS.primaryDark }}>
                  <MapPin className="w-4 h-4" style={{ color: COLORS.red }} />
                  Statistiques régionales
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b" style={{ borderColor: '#E5E7EB' }}>
                        <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Région</th>
                        <th className="text-center py-3 px-4 text-xs font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Centres</th>
                        <th className="text-right py-3 px-4 text-xs font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Candidats</th>
                        <th className="text-right py-3 px-4 text-xs font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Examens réussis</th>
                        <th className="text-center py-3 px-4 text-xs font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Taux de réussite</th>
                        <th className="text-right py-3 px-4 text-xs font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Revenus</th>
                      </tr>
                    </thead>
                    <tbody>
                      {regionalStats.map((row, i) => (
                        <tr key={row.region} className={`border-b last:border-0 hover:bg-gray-50/50 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`} style={{ borderColor: '#F3F4F6' }}>
                          <td className="py-3 px-4 font-medium" style={{ color: COLORS.primaryDark }}>{row.region}</td>
                          <td className="py-3 px-4 text-center">
                            <Badge variant="outline" className="text-xs font-medium" style={{ borderColor: '#E5E7EB', color: COLORS.primaryDark }}>
                              {row.centres}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-xs" style={{ color: '#6B7280' }}>{row.candidates.toLocaleString('fr-FR')}</td>
                          <td className="py-3 px-4 text-right font-mono text-xs" style={{ color: '#6B7280' }}>{row.examsPassed.toLocaleString('fr-FR')}</td>
                          <td className="py-3 px-4 text-center">
                            <span className="text-sm font-bold" style={{ color: getSuccessRateColor(row.successRate) }}>
                              {row.successRate}%
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-xs" style={{ color: '#6B7280' }}>{formatCurrency(row.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════ TAB 2: Anti-fraude ═══════ */}
          <TabsContent value="fraud" className="space-y-4">
            {/* Fraud Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Alertes actives', value: '12', icon: AlertTriangle, color: COLORS.red, bg: '#CE112612' },
                { label: 'En investigation', value: '8', icon: Search, color: COLORS.yellow, bg: '#FCD11612' },
                { label: 'Résolues ce mois', value: '45', icon: CheckCircle, color: COLORS.green, bg: '#00946012' },
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
              {/* Fraud Alert Feed */}
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
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                    {fraudAlerts.map((alert) => {
                      const sev = getSeverityConfig(alert.severity);
                      const stat = getStatusConfig(alert.status);
                      return (
                        <div
                          key={alert.id}
                          className="p-3 rounded-lg border-l-4 hover:bg-gray-50/50 transition-colors"
                          style={{ borderLeftColor: sev.border, backgroundColor: sev.bg }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-semibold" style={{ color: COLORS.primaryDark }}>{alert.type}</span>
                                <Badge className="text-[10px] px-1.5 py-0 h-4 font-semibold" style={{ backgroundColor: sev.bg, color: sev.color, borderColor: sev.color, borderWidth: 1 }}>
                                  {sev.label}
                                </Badge>
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-medium" style={{ backgroundColor: stat.bg, color: stat.color, borderColor: stat.color }}>
                                  {stat.label}
                                </Badge>
                              </div>
                              <p className="text-xs mt-1 leading-relaxed" style={{ color: '#6B7280' }}>{alert.description}</p>
                              <p className="text-[10px] mt-1.5 flex items-center gap-1" style={{ color: '#9CA3AF' }}>
                                <Clock className="w-3 h-3" />
                                {formatTimestamp(alert.timestamp)}
                                {alert.centreId && (
                                  <span className="ml-2">— {alert.centreId}</span>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" style={{ color: COLORS.primaryDark }}>
                              <Eye className="w-3 h-3 mr-1" />
                              Examiner
                            </Button>
                            {alert.status === 'active' && (
                              <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" style={{ color: COLORS.red }}>
                                <Ban className="w-3 h-3 mr-1" />
                                Suspendre
                              </Button>
                            )}
                            {alert.status !== 'resolved' && (
                              <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" style={{ color: '#6B7280' }}>
                                Archiver
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Fraud by Center BarChart + Blacklist */}
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
                    </div>
                  </CardContent>
                </Card>

                {/* Blacklist */}
                <Card className="border-0 shadow-sm bg-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: COLORS.primaryDark }}>
                      <Ban className="w-4 h-4" style={{ color: COLORS.red }} />
                      Liste noire
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      {blacklistedCandidates.map((c, i) => (
                        <div key={i} className="p-2.5 rounded-lg border" style={{ borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' }}>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-semibold" style={{ color: COLORS.primaryDark }}>{c.nom}</p>
                              <p className="text-[10px] font-mono" style={{ color: '#9CA3AF' }}>{c.id}</p>
                            </div>
                            <Badge className="text-[10px] px-1.5 h-4 bg-red-100 text-red-700 hover:bg-red-100">
                              Banni
                            </Badge>
                          </div>
                          <p className="text-[10px] mt-1" style={{ color: '#6B7280' }}>{c.raison}</p>
                          <p className="text-[10px]" style={{ color: '#9CA3AF' }}>Depuis le {c.date}</p>
                        </div>
                      ))}
                    </div>
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
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1" style={{ borderColor: '#E5E7EB', color: '#6B7280' }}>
                      <Search className="w-3 h-3" />
                      Rechercher
                    </Button>
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1" style={{ borderColor: '#E5E7EB', color: '#6B7280' }}>
                      <Filter className="w-3 h-3" />
                      Filtrer
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b" style={{ borderColor: '#E5E7EB' }}>
                        <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Centre</th>
                        <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Région</th>
                        <th className="text-center py-3 px-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Capacité</th>
                        <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Score qualité</th>
                        <th className="text-center py-3 px-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Accréditation</th>
                        <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Langues</th>
                        <th className="text-center py-3 px-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Statut</th>
                        <th className="text-center py-3 px-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {centres.map((centre, i) => {
                        const accred = centre.accreditation;
                        const accredBadge = accred ? getAccreditationBadge(accred.statut) : null;
                        const qualityColor = accred ? getQualityColor(accred.scoreQualite) : '#6B7280';
                        return (
                          <tr key={centre.id} className={`border-b last:border-0 hover:bg-gray-50/50 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`} style={{ borderColor: '#F3F4F6' }}>
                            <td className="py-3 px-3">
                              <div>
                                <p className="font-medium text-sm" style={{ color: COLORS.primaryDark }}>{centre.nom}</p>
                                <p className="text-[10px] flex items-center gap-1 mt-0.5" style={{ color: '#9CA3AF' }}>
                                  <MapPin className="w-3 h-3" />
                                  {centre.adresse}
                                </p>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-xs" style={{ color: '#6B7280' }}>{centre.region}</td>
                            <td className="py-3 px-3 text-center text-xs font-medium" style={{ color: COLORS.primaryDark }}>{centre.capacite}</td>
                            <td className="py-3 px-3">
                              {accred ? (
                                <div className="flex items-center gap-2">
                                  <Progress value={accred.scoreQualite} className="h-2 flex-1" style={{ '--progress-color': qualityColor } as React.CSSProperties} />
                                  <span className="text-xs font-bold w-8 text-right" style={{ color: qualityColor }}>{accred.scoreQualite}</span>
                                </div>
                              ) : (
                                <span className="text-xs" style={{ color: '#9CA3AF' }}>N/A</span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-center">
                              {accredBadge ? (
                                <Badge className="text-[10px] px-1.5 py-0 h-5 font-semibold" style={{ backgroundColor: accredBadge.bg, color: accredBadge.color }}>
                                  {accredBadge.label}
                                </Badge>
                              ) : (
                                <span className="text-xs" style={{ color: '#9CA3AF' }}>N/A</span>
                              )}
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex flex-wrap gap-1">
                                {centre.languesDisponibles.map((lang) => (
                                  <Badge key={lang} variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-medium" style={{ borderColor: '#E5E7EB', color: '#6B7280' }}>
                                    {getLangName(lang)}
                                  </Badge>
                                ))}
                              </div>
                            </td>
                            <td className="py-3 px-3 text-center">
                              {centre.actif ? (
                                <Badge className="text-[10px] px-1.5 py-0 h-5 font-semibold bg-green-50 text-green-700 hover:bg-green-50">
                                  <CheckCircle className="w-3 h-3 mr-0.5" />
                                  Actif
                                </Badge>
                              ) : (
                                <Badge className="text-[10px] px-1.5 py-0 h-5 font-semibold bg-red-50 text-red-700 hover:bg-red-50">
                                  <XCircle className="w-3 h-3 mr-0.5" />
                                  Inactif
                                </Badge>
                              )}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" style={{ color: COLORS.green }}>
                                Voir détails
                                <ChevronRight className="w-3 h-3" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════ TAB 4: Analyses ═══════ */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Daily Exam Volume AreaChart */}
              <Card className="border-0 shadow-sm bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: COLORS.primaryDark }}>
                    <Activity className="w-4 h-4" style={{ color: COLORS.green }} />
                    Volume d&apos;examens quotidien (30 jours)
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-64">
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
                  </div>
                </CardContent>
              </Card>

              {/* Success Rate by Language BarChart */}
              <Card className="border-0 shadow-sm bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: COLORS.primaryDark }}>
                    <Globe className="w-4 h-4" style={{ color: COLORS.primaryDark }} />
                    Taux de réussite par langue
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={successByLanguage} margin={{ top: 5, right: 10, left: -10, bottom: 5 }} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis type="number" tick={{ fontSize: 10, fill: '#9CA3AF' }} domain={[0, 100]} unit="%" />
                        <YAxis type="category" dataKey="langue" tick={{ fontSize: 11, fill: '#6B7280' }} width={80} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="taux" name="Taux de réussite" radius={[0, 4, 4, 0]} barSize={24}>
                          {successByLanguage.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={LANGUAGE_PIE_COLORS[index]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Category Scores */}
              <Card className="border-0 shadow-sm bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: COLORS.primaryDark }}>
                    <FileCheck className="w-4 h-4" style={{ color: COLORS.green }} />
                    Score moyen par catégorie
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {categoryScores.map((cat) => {
                      const scoreColor = cat.score >= 80 ? COLORS.green : cat.score >= 70 ? COLORS.yellow : COLORS.red;
                      return (
                        <div key={cat.categorie} className="flex items-center gap-3">
                          <span className="text-xs w-28 flex-shrink-0 font-medium" style={{ color: COLORS.primaryDark }}>{cat.categorie}</span>
                          <div className="flex-1">
                            <Progress value={cat.score} className="h-2.5" style={{ '--progress-color': scoreColor } as React.CSSProperties} />
                          </div>
                          <span className="text-xs font-bold w-10 text-right" style={{ color: scoreColor }}>{cat.score}%</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Top Centres Leaderboard */}
              <Card className="border-0 shadow-sm bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: COLORS.primaryDark }}>
                    <TrendingUp className="w-4 h-4" style={{ color: COLORS.yellow }} />
                    Top centres — Classement
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {topCentres.map((c, i) => (
                      <div key={c.nom} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50/50 transition-colors">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          i === 0 ? 'text-white' : ''
                        }`} style={{
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
                          <p className="text-[10px]" style={{ color: '#9CA3AF' }}>réussite</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
