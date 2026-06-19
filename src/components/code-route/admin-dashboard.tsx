'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ViewType, FraudAlert, FraudSeverity, RegionalStat, Centre, NationalLanguage } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { HealthCheckWidget } from './health-check-widget';
import { TwoFactorSettings } from './two-factor-settings';
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
  UserCog,
  CalendarCheck,
  Pencil,
  ToggleLeft,
  ToggleRight,
  X,
  Save,
  MessageSquare,
  Gavel,
  FileSearch,
  ShieldOff,
} from 'lucide-react';

// ─── Color Palette ──────────────────────────────────────
const COLORS = {
  primaryDark: '#1A2332',
  red: '#CE1126',
  yellow: '#FCD116',
  green: '#009460',
};

const CHART_COLORS = ['#009460', '#FCD116', '#CE1126', '#1A2332', '#7C3AED', '#0EA5E9'];

// ─── API Response Types ─────────────────────────────────
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

interface ApiUser {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  dateNaissance: string;
  numeroIdentite: string;
  telephone: string;
  ville: string;
  region: string;
  categoriePermis: string;
  role: string;
  numeroUnique: string;
  langueMaternelle: string;
  actif: boolean;
  createdAt: string;
  updatedAt: string;
  _count: { examSessions: number; bookings: number };
}

interface ApiBooking {
  id: string;
  candidatId: string;
  centreId: string;
  centreNom: string;
  region: string;
  ville: string;
  date: string;
  heure: string;
  langue: string;
  categoriePermis: string;
  montant: number;
  moyenPaiement: string;
  numeroPaiement?: string;
  referencePaiement?: string;
  statutPaiement: string;
  numeroConvocation?: string;
  confirmee: boolean;
  createdAt: string;
  candidat: { id: string; nom: string; prenom: string; numeroUnique: string; telephone: string; email: string };
  centre: { id: string; nom: string; ville: string; region: string };
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
  if (diffH < 1) return "Il y a moins d'1h";
  if (diffH < 24) return `Il y a ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  return `Il y a ${diffD}j`;
}

function getSeverityConfig(severity: FraudSeverity) {
  switch (severity) {
    case 'critical': return { label: 'Critique', color: '#CE1126', bg: '#CE112610', border: '#CE1126' };
    case 'high': return { label: 'Eleve', color: '#E85D04', bg: '#E85D0410', border: '#E85D04' };
    case 'medium': return { label: 'Moyen', color: '#FCD116', bg: '#FCD11610', border: '#FCD116' };
    case 'low': return { label: 'Faible', color: '#009460', bg: '#00946010', border: '#009460' };
    default: return { label: 'Info', color: '#6B7280', bg: '#6B728010', border: '#6B7280' };
  }
}

function getStatusConfig(status: string) {
  switch (status) {
    case 'active': return { label: 'Active', color: '#CE1126', bg: '#CE112615' };
    case 'investigating': return { label: 'En investigation', color: '#FCD116', bg: '#FCD11615' };
    case 'resolved': return { label: 'Resolue', color: '#009460', bg: '#00946015' };
    case 'dismissed': return { label: 'Ecartee', color: '#6B7280', bg: '#6B728015' };
    default: return { label: status, color: '#6B7280', bg: '#6B728015' };
  }
}

function getAccreditationBadge(statut: string) {
  switch (statut) {
    case 'actif': return { label: 'Actif', color: '#009460', bg: '#00946015' };
    case 'en_renouvellement': return { label: 'Renouvellement', color: '#FCD116', bg: '#FCD11615' };
    case 'expire': return { label: 'Expire', color: '#CE1126', bg: '#CE112615' };
    case 'suspendu': return { label: 'Suspendu', color: '#6B7280', bg: '#6B728015' };
    default: return { label: statut, color: '#6B7280', bg: '#6B728015' };
  }
}

function getRoleLabel(role: string) {
  switch (role) {
    case 'super-admin': return { label: 'Super Admin', color: '#7C3AED', bg: '#7C3AED15' };
    case 'administration': return { label: 'Administration', color: '#1A2332', bg: '#1A233215' };
    case 'centre-agree': return { label: 'Centre Agree', color: '#009460', bg: '#00946015' };
    case 'auto-ecole': return { label: 'Auto-ecole', color: '#FCD116', bg: '#FCD11615' };
    case 'candidat': return { label: 'Candidat', color: '#0EA5E9', bg: '#0EA5E915' };
    default: return { label: role, color: '#6B7280', bg: '#6B728015' };
  }
}

function getPaymentStatusConfig(status: string) {
  switch (status) {
    case 'confirme': return { label: 'Confirme', color: '#009460', bg: '#00946015' };
    case 'en_attente': return { label: 'En attente', color: '#FCD116', bg: '#FCD11615' };
    case 'echoue': return { label: 'Echoue', color: '#CE1126', bg: '#CE112615' };
    case 'rembourse': return { label: 'Rembourse', color: '#6B7280', bg: '#6B728015' };
    default: return { label: status, color: '#6B7280', bg: '#6B728015' };
  }
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

// ─── Confirmation Modal ─────────────────────────────────
function ConfirmModal({ open, title, message, onConfirm, onCancel, confirmLabel, confirmColor }: {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel: string;
  confirmColor: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onCancel}>
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-2" style={{ color: COLORS.primaryDark }}>{title}</h3>
        <p className="text-sm text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" size="sm" onClick={onCancel}>Annuler</Button>
          <Button size="sm" onClick={onConfirm} style={{ backgroundColor: confirmColor, color: '#fff' }}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Notes Modal ────────────────────────────────────────
function NotesModal({ open, title, onConfirm, onCancel }: {
  open: boolean;
  title: string;
  onConfirm: (notes: string) => void;
  onCancel: () => void;
}) {
  const [notes, setNotes] = useState('');
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onCancel}>
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-2" style={{ color: COLORS.primaryDark }}>{title}</h3>
        <textarea
          className="w-full border border-gray-300 rounded-lg p-3 text-sm mb-4 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="Notes de resolution..."
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />
        <div className="flex justify-end gap-3">
          <Button variant="outline" size="sm" onClick={onCancel}>Annuler</Button>
          <Button size="sm" onClick={() => onConfirm(notes)} style={{ backgroundColor: COLORS.green, color: '#fff' }}>
            <Save className="w-3.5 h-3.5 mr-1" />
            Confirmer
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Role-based sidebar items ──────────────────────────
function getSidebarItems(role: string) {
  const baseItems = [
    { id: 'overview', label: "Vue d'ensemble", icon: LayoutDashboard, roles: ['super-admin', 'administration', 'centre-agree'] },
    { id: 'analytics', label: 'Analyses', icon: BarChart3, roles: ['super-admin', 'administration'] },
    { id: 'fraud', label: 'Anti-fraude', icon: AlertOctagon, roles: ['super-admin', 'administration'] },
    { id: 'centers', label: 'Centres', icon: Building2, roles: ['super-admin', 'administration'] },
    { id: 'bookings', label: 'Reservations', icon: CalendarCheck, roles: ['super-admin', 'administration'] },
    { id: 'users', label: 'Utilisateurs', icon: UserCog, roles: ['super-admin', 'administration'] },
    { id: 'audit', label: 'Journal d\'audit', icon: FileSearch, roles: ['super-admin'] },
    { id: 'system', label: 'Système', icon: Activity, roles: ['super-admin'] },
    { id: 'settings', label: 'Parametres', icon: Settings, roles: ['super-admin', 'administration'] },
  ];
  return baseItems.filter(item => item.roles.includes(role));
}

// ─── Component ──────────────────────────────────────────
export default function AdminDashboard({ onViewChange }: { onViewChange?: (view: ViewType) => void }) {
  const { user, apiFetch } = useAuth();
  const userRole = user?.role || 'administration';
  const sidebarItems = getSidebarItems(userRole);
  const [activeTab, setActiveTab] = useState(sidebarItems[0]?.id || 'overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // ─── Data state ───────────────────────────────────────
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [kpi, setKpi] = useState<ApiKpi>({
    totalCandidates: 0, totalExams: 0, passedExams: 0,
    totalCentres: 0, totalRevenue: 0, avgSuccessRate: 0, activeFraudAlerts: 0,
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
    candidates: [] as number[], exams: [] as number[],
    successRate: [] as number[], centres: [] as number[],
  });
  const [fraudBySeverity, setFraudBySeverity] = useState<ApiFraudBySeverity[]>([]);

  // ─── Users state ──────────────────────────────────────
  const [usersData, setUsersData] = useState<ApiUser[]>([]);
  const [usersSearch, setUsersSearch] = useState('');
  const [usersRoleFilter, setUsersRoleFilter] = useState('');
  const [usersLoading, setUsersLoading] = useState(false);

  // ─── Bookings state ───────────────────────────────────
  const [bookingsData, setBookingsData] = useState<ApiBooking[]>([]);
  const [bookingsFilter, setBookingsFilter] = useState('');
  const [bookingsLoading, setBookingsLoading] = useState(false);

  // ─── Audit logs state ─────────────────────────────────
  const [auditLogs, setAuditLogs] = useState<Array<{
    id: string; eventType: string; severity: string; userId?: string;
    userRole?: string; description: string; timestamp: string; ipAddress?: string;
  }>>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditFilter, setAuditFilter] = useState('');
  const [auditTotal, setAuditTotal] = useState(0);

  // ─── Password change state ────────────────────────────
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);
  const [passwordChangeMessage, setPasswordChangeMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ─── Action state ─────────────────────────────────────
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; title: string; message: string; onConfirm: () => void; confirmLabel: string; confirmColor: string }>({
    open: false, title: '', message: '', onConfirm: () => {}, confirmLabel: '', confirmColor: '',
  });
  const [notesModal, setNotesModal] = useState<{ open: boolean; title: string; onConfirm: (notes: string) => void }>({
    open: false, title: '', onConfirm: () => {},
  });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // ─── Fetch dashboard data ─────────────────────────────
  const fetchDashboardData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/stats');
      if (!res.ok) throw new Error(`Erreur ${res.status}: ${res.statusText}`);
      const data: ApiResponse = await res.json();

      setKpi(data.kpi);
      setMonthlyExamData(data.monthlyExamVolume);
      setRegionalStats(data.regionalStats);

      const mappedFraudAlerts: FraudAlert[] = (data.fraudAlerts || []).map((fa) => ({
        id: fa.id, type: fa.type, description: fa.description,
        severity: (fa.severity || 'medium') as FraudSeverity,
        status: (fa.status || 'active') as FraudAlert['status'],
        candidatId: fa.candidatId, centreId: fa.centreId,
        timestamp: fa.timestamp,
        details: fa.details ? (typeof fa.details === 'string' ? JSON.parse(fa.details) : fa.details) : undefined,
      }));
      setFraudAlerts(mappedFraudAlerts);

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

      setFraudBySeverity(data.fraudBySeverity || []);

      const mappedCentres: Centre[] = (data.centres || []).map((c) => ({
        id: c.id, nom: c.nom, ville: c.ville, region: c.region,
        adresse: c.adresse, capacite: c.capacite, telephone: c.telephone, email: c.email,
        actif: c.actif,
        accreditation: {
          dateDebut: c.accredDateDebut || '', dateFin: c.accredDateFin || '',
          statut: (c.accredStatut || 'actif') as NonNullable<Centre['accreditation']>['statut'],
          scoreQualite: Math.round(c.accredScore || 0),
        },
        equipements: c.equipements || [],
        languesDisponibles: (c.languesDisponibles || ['fr']) as NationalLanguage[],
      }));
      setCentresData(mappedCentres);
      setCategoryScores(data.categoryScores || []);

      const mappedDaily = (data.dailyStats || [])
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((ds) => {
          const d = new Date(ds.date);
          const dayStr = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
          return { date: dayStr, examens: ds.exams, reussis: ds.passed };
        });
      setDailyExamVolume(mappedDaily);

      const top5 = [...(mappedCentres || [])]
        .filter(c => c.accreditation)
        .sort((a, b) => (b.accreditation?.scoreQualite || 0) - (a.accreditation?.scoreQualite || 0))
        .slice(0, 5)
        .map(c => ({
          nom: c.nom, region: c.region,
          score: c.accreditation?.scoreQualite || 0,
          taux: Math.round(c.accreditation?.scoreQualite ? c.accreditation.scoreQualite * 0.85 : 0),
        }));
      setTopCentres(top5);

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

  // ─── Fetch users ──────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const params = new URLSearchParams();
      if (usersSearch) params.set('search', usersSearch);
      if (usersRoleFilter) params.set('role', usersRoleFilter);
      const res = await fetch(`/api/admin/users?${params}`);
      if (res.ok) {
        const data = await res.json();
        setUsersData(data.users || []);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
    setUsersLoading(false);
  }, [usersSearch, usersRoleFilter]);

  // ─── Fetch bookings ───────────────────────────────────
  const fetchBookings = useCallback(async () => {
    setBookingsLoading(true);
    try {
      const params = new URLSearchParams();
      if (bookingsFilter) params.set('statutPaiement', bookingsFilter);
      const res = await fetch(`/api/admin/bookings?${params}`);
      if (res.ok) {
        const data = await res.json();
        setBookingsData(data.bookings || []);
      }
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    }
    setBookingsLoading(false);
  }, [bookingsFilter]);

  // ─── Fetch audit logs ────────────────────────────────
  const fetchAuditLogs = useCallback(async () => {
    setAuditLoading(true);
    try {
      const params = new URLSearchParams();
      if (auditFilter) params.set('eventType', auditFilter);
      params.set('limit', '100');
      const res = await fetch(`/api/admin/audit-logs?${params}`);
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.logs || []);
        setAuditTotal(data.total || 0);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    }
    setAuditLoading(false);
  }, [auditFilter]);

  // ─── Change password ─────────────────────────────────
  const handleChangePassword = async () => {
    if (newPassword !== confirmNewPassword) {
      setPasswordChangeMessage({ type: 'error', text: 'Les mots de passe ne correspondent pas.' });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordChangeMessage({ type: 'error', text: 'Le mot de passe doit contenir au moins 8 caracteres.' });
      return;
    }
    setPasswordChangeLoading(true);
    setPasswordChangeMessage(null);
    try {
      const res = await apiFetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setPasswordChangeMessage({ type: 'success', text: 'Mot de passe modifie avec succes.' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      } else {
        setPasswordChangeMessage({ type: 'error', text: data.error || 'Erreur lors du changement.' });
      }
    } catch {
      setPasswordChangeMessage({ type: 'error', text: 'Erreur de connexion.' });
    }
    setPasswordChangeLoading(false);
  };

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await fetchDashboardData();
      setIsLoading(false);
    };
    load();
  }, [fetchDashboardData]);

  // Fetch users/bookings when their tabs are active
  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
  }, [activeTab, fetchUsers]);

  useEffect(() => {
    if (activeTab === 'bookings') fetchBookings();
  }, [activeTab, fetchBookings]);

  useEffect(() => {
    if (activeTab === 'audit') fetchAuditLogs();
  }, [activeTab, fetchAuditLogs]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchDashboardData();
    setIsRefreshing(false);
  };

  // ─── Admin Actions ────────────────────────────────────
  const toggleUserActive = async (userId: string, currentActif: boolean) => {
    setActionLoading(userId);
    try {
      const res = await apiFetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actif: !currentActif }),
      });
      if (res.ok) {
        setUsersData(prev => prev.map(u => u.id === userId ? { ...u, actif: !currentActif } : u));
      } else {
        const data = await res.json();
        alert(data.error || 'Erreur lors de la modification');
      }
    } catch {
      alert('Erreur de connexion');
    }
    setActionLoading(null);
  };

  const changeUserRole = async (userId: string, newRole: string) => {
    setActionLoading(userId);
    try {
      const res = await apiFetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        setUsersData(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      } else {
        const data = await res.json();
        alert(data.error || 'Erreur lors de la modification');
      }
    } catch {
      alert('Erreur de connexion');
    }
    setActionLoading(null);
  };

  const toggleCentreActive = async (centreId: string, currentActif: boolean) => {
    setActionLoading(centreId);
    try {
      const res = await apiFetch(`/api/admin/centres/${centreId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actif: !currentActif }),
      });
      if (res.ok) {
        setCentresData(prev => prev.map(c => c.id === centreId ? { ...c, actif: !currentActif } : c));
      }
    } catch {
      alert('Erreur de connexion');
    }
    setActionLoading(null);
  };

  const suspendCentre = async (centreId: string) => {
    setActionLoading(centreId);
    try {
      const res = await apiFetch(`/api/admin/centres/${centreId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accredStatut: 'suspendu', actif: false }),
      });
      if (res.ok) {
        const data = await res.json();
        const updated = data.centre;
        setCentresData(prev => prev.map(c => {
          if (c.id !== centreId) return c;
          return {
            ...c,
            actif: updated.actif,
            accreditation: c.accreditation ? { ...c.accreditation, statut: updated.accredStatut } : c.accreditation,
          };
        }));
      }
    } catch {
      alert('Erreur de connexion');
    }
    setActionLoading(null);
  };

  const reactivateCentre = async (centreId: string) => {
    setActionLoading(centreId);
    try {
      const res = await apiFetch(`/api/admin/centres/${centreId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accredStatut: 'actif', actif: true }),
      });
      if (res.ok) {
        const data = await res.json();
        const updated = data.centre;
        setCentresData(prev => prev.map(c => {
          if (c.id !== centreId) return c;
          return {
            ...c,
            actif: updated.actif,
            accreditation: c.accreditation ? { ...c.accreditation, statut: updated.accredStatut } : c.accreditation,
          };
        }));
      }
    } catch {
      alert('Erreur de connexion');
    }
    setActionLoading(null);
  };

  const updateFraudStatus = async (alertId: string, newStatus: string, notes?: string) => {
    setActionLoading(alertId);
    try {
      const res = await apiFetch(`/api/admin/fraud/${alertId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, notes }),
      });
      if (res.ok) {
        setFraudAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: newStatus as FraudAlert['status'] } : a));
      } else {
        const data = await res.json();
        alert(data.error || 'Erreur');
      }
    } catch {
      alert('Erreur de connexion');
    }
    setActionLoading(null);
  };

  const updateBookingStatus = async (bookingId: string, statutPaiement: string, confirmee?: boolean) => {
    setActionLoading(bookingId);
    try {
      const body: Record<string, unknown> = { statutPaiement };
      if (confirmee !== undefined) body.confirmee = confirmee;
      const res = await apiFetch(`/api/admin/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        setBookingsData(prev => prev.map(b => b.id === bookingId ? { ...b, ...data.booking } : b));
      }
    } catch {
      alert('Erreur de connexion');
    }
    setActionLoading(null);
  };

  // ─── CSV Export ───────────────────────────────────────
  const exportCSV = (data: Record<string, unknown>[], filename: string) => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(h => {
        const val = row[h];
        const str = typeof val === 'object' ? JSON.stringify(val) : String(val ?? '');
        return `"${str.replace(/"/g, '""')}"`;
      }).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const currentDate = new Date();
  const dateStr = currentDate.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = currentDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const activeFraudCount = fraudAlerts.filter(a => a.status === 'active').length;
  const investigatingFraudCount = fraudAlerts.filter(a => a.status === 'investigating').length;

  // ─── Role label ───────────────────────────────────────
  const roleDisplay = getRoleLabel(userRole);

  // ─── Loading skeleton ─────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F0F2F5' }}>
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin mx-auto" style={{ color: COLORS.green }} />
          <div>
            <p className="text-lg font-semibold" style={{ color: COLORS.primaryDark }}>Chargement du tableau de bord</p>
            <p className="text-sm text-gray-500 mt-1">Recuperation des donnees en temps reel...</p>
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

        <nav className="flex-1 py-3 px-2 space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive ? 'text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
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

        {!sidebarCollapsed && (
          <div className="p-4 border-t" style={{ borderColor: '#E5E7EB' }}>
            <div className="rounded-xl p-3" style={{ backgroundColor: '#F0F7F4' }}>
              <p className="text-xs font-semibold" style={{ color: COLORS.green }}>Republique de Guinee</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Ministere des Transports</p>
            </div>
          </div>
        )}
      </aside>

      {/* ─── Main Content ─── */}
      <main className="flex-1 min-w-0">
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
              {sidebarItems.find(s => s.id === activeTab)?.label || "Vue d'ensemble"}
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
                  <Badge className="px-3 py-1 text-xs font-semibold" style={{ backgroundColor: roleDisplay.color, color: '#FFFFFF' }}>
                    <Shield className="w-3.5 h-3.5 mr-1.5" />
                    {roleDisplay.label}
                  </Badge>
                  <Badge variant="outline" className="px-3 py-1 text-xs font-medium" style={{ borderColor: COLORS.green, color: COLORS.green }}>
                    <Activity className="w-3.5 h-3.5 mr-1.5" />
                    En ligne
                  </Badge>
                  <span className="text-xs text-gray-400 hidden sm:inline">
                    <Clock className="w-3 h-3 inline mr-1" />
                    {dateStr} -- {timeStr}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="text-xs gap-1.5 h-8" style={{ borderColor: COLORS.primaryDark, color: COLORS.primaryDark }} onClick={() => exportCSV(regionalStats as unknown as Record<string, unknown>[], 'stats_regionales')}>
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
                  Reessayer
                </Button>
              </CardContent>
            </Card>
          )}

          {/* ─── KPI Stats Row ─── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { title: 'Candidats inscrits', value: kpi.totalCandidates.toLocaleString('fr-FR'), icon: Users, color: COLORS.green, bgColor: '#00946012', sparkData: sparklineData.candidates, sparkColor: COLORS.green },
              { title: 'Centres agrees', value: kpi.totalCentres.toLocaleString('fr-FR'), icon: Building2, color: COLORS.yellow, bgColor: '#FCD11612', sparkData: sparklineData.centres, sparkColor: COLORS.yellow },
              { title: 'Examens total', value: kpi.totalExams.toLocaleString('fr-FR'), icon: FileCheck, color: COLORS.red, bgColor: '#CE112612', sparkData: sparklineData.exams, sparkColor: COLORS.red },
              { title: 'Taux de reussite', value: `${kpi.avgSuccessRate}%`, icon: TrendingUp, color: COLORS.primaryDark, bgColor: '#1A233212', sparkData: sparklineData.successRate, sparkColor: COLORS.primaryDark },
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
            <TabsList className="bg-white shadow-sm border-0 h-11 p-1 rounded-lg lg:hidden flex flex-wrap">
              {sidebarItems.map(item => (
                <TabsTrigger key={item.id} value={item.id} className="text-xs font-medium px-3 data-[state=active]:shadow-sm rounded-md data-[state=active]:text-white" style={{ color: COLORS.primaryDark }}>
                  <item.icon className="w-3.5 h-3.5 mr-1" />
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* ═══════ TAB: Vue d'ensemble ═══════ */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
                            <Line type="monotone" dataKey="reussis" name="Reussis" stroke={COLORS.yellow} strokeWidth={2.5} dot={{ r: 4, fill: COLORS.yellow }} activeDot={{ r: 6 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                          <BarChart3 className="w-10 h-10 mb-2" />
                          <p className="text-sm">Aucune donnee mensuelle disponible</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

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
                      <p className="text-2xl font-bold" style={{ color: COLORS.primaryDark }}>Francais</p>
                      <p className="text-sm text-gray-500 mt-1">100% des examens</p>
                      <p className="text-xs text-gray-400 mt-3">Soussou, Poular, Malinke -- bientot disponible</p>
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
                      Statistiques regionales
                    </CardTitle>
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1" style={{ borderColor: COLORS.green, color: COLORS.green }} onClick={() => exportCSV(regionalStats as unknown as Record<string, unknown>[], 'stats_regionales')}>
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
                            <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Region</th>
                            <th className="text-center py-3 px-4 text-xs font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Centres</th>
                            <th className="text-right py-3 px-4 text-xs font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Candidats</th>
                            <th className="text-right py-3 px-4 text-xs font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Reussis</th>
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
                      <p className="text-sm">Aucune donnee regionale disponible</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ═══════ TAB: Analyses ═══════ */}
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
                            <Area type="monotone" dataKey="reussis" name="Reussis" stroke={COLORS.yellow} strokeWidth={2} fillOpacity={1} fill="url(#colorReussis)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                          <Activity className="w-10 h-10 mb-2" />
                          <p className="text-sm">Aucune donnee quotidienne disponible</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: COLORS.primaryDark }}>
                      <Globe className="w-4 h-4" style={{ color: COLORS.green }} />
                      Taux de reussite global
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
                      <p className="text-sm text-gray-500 mt-4">Taux de reussite en francais</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="border-0 shadow-sm bg-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: COLORS.primaryDark }}>
                      <FileCheck className="w-4 h-4" style={{ color: COLORS.green }} />
                      Score moyen par categorie
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
                        <p className="text-sm">Aucune donnee de categorie disponible</p>
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
                              <p className="text-[10px]" style={{ color: '#9CA3AF' }}>{c.region} -- Score: {c.score}/100</p>
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
                        <p className="text-sm">Aucun centre a afficher</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ═══════ TAB: Anti-fraude ═══════ */}
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
                <Card className="border-0 shadow-sm bg-white lg:col-span-3">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: COLORS.primaryDark }}>
                        <CircleAlert className="w-4 h-4" style={{ color: COLORS.red }} />
                        Flux d&apos;alertes en temps reel
                      </CardTitle>
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1" style={{ borderColor: COLORS.green, color: COLORS.green }} onClick={() => exportCSV(fraudAlerts as unknown as Record<string, unknown>[], 'alertes_fraude')}>
                        <Download className="w-3 h-3" />
                        Export
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {fraudAlerts.length > 0 ? (
                      <div className="overflow-x-auto max-h-96 overflow-y-auto">
                        <table className="w-full text-sm">
                          <thead className="sticky top-0 bg-white">
                            <tr className="border-b" style={{ borderColor: '#E5E7EB' }}>
                              <th className="text-left py-2 px-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Type</th>
                              <th className="text-left py-2 px-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Severite</th>
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
                                    <div className="flex items-center justify-center gap-1">
                                      {alert.status === 'active' && (
                                        <Button
                                          variant="ghost" size="sm" className="h-6 text-[10px] px-2"
                                          style={{ color: COLORS.yellow }}
                                          disabled={actionLoading === alert.id}
                                          onClick={() => updateFraudStatus(alert.id, 'investigating')}
                                          title="Lancer l'investigation"
                                        >
                                          <FileSearch className="w-3 h-3" />
                                        </Button>
                                      )}
                                      {(alert.status === 'active' || alert.status === 'investigating') && (
                                        <Button
                                          variant="ghost" size="sm" className="h-6 text-[10px] px-2"
                                          style={{ color: COLORS.green }}
                                          disabled={actionLoading === alert.id}
                                          onClick={() => setNotesModal({
                                            open: true,
                                            title: 'Resoudre l\'alerte',
                                            onConfirm: (notes) => { updateFraudStatus(alert.id, 'resolved', notes); setNotesModal({ open: false, title: '', onConfirm: () => {} }); },
                                          })}
                                          title="Resoudre"
                                        >
                                          <Gavel className="w-3 h-3" />
                                        </Button>
                                      )}
                                      {(alert.status === 'active' || alert.status === 'investigating') && (
                                        <Button
                                          variant="ghost" size="sm" className="h-6 text-[10px] px-2"
                                          style={{ color: '#6B7280' }}
                                          disabled={actionLoading === alert.id}
                                          onClick={() => setConfirmModal({
                                            open: true,
                                            title: 'Ecarter l\'alerte',
                                            message: 'Etes-vous sur de vouloir ecarter cette alerte de fraude ?',
                                            confirmLabel: 'Ecarter',
                                            confirmColor: '#6B7280',
                                            onConfirm: () => { updateFraudStatus(alert.id, 'dismissed'); setConfirmModal({ ...confirmModal, open: false }); },
                                          })}
                                          title="Ecarter"
                                        >
                                          <ShieldOff className="w-3 h-3" />
                                        </Button>
                                      )}
                                      {actionLoading === alert.id && <Loader2 className="w-3 h-3 animate-spin" style={{ color: COLORS.green }} />}
                                    </div>
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
                            <p className="text-xs">Aucune donnee</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-sm bg-white">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: COLORS.primaryDark }}>
                        <Ban className="w-4 h-4" style={{ color: COLORS.red }} />
                        Candidats desactives (fraude)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {usersData.filter(u => !u.actif && u.role === 'candidat').length > 0 ? (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {usersData.filter(u => !u.actif && u.role === 'candidat').slice(0, 10).map((c) => (
                            <div key={c.id} className="p-2.5 rounded-lg border" style={{ borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' }}>
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-xs font-semibold" style={{ color: COLORS.primaryDark }}>{c.prenom} {c.nom}</p>
                                  <p className="text-[10px] font-mono" style={{ color: '#9CA3AF' }}>{c.numeroUnique}</p>
                                </div>
                                <Badge className="text-[10px] px-1.5 h-4 bg-red-100 text-red-700 hover:bg-red-100">Desactive</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-8 text-center text-gray-400">
                          <Ban className="w-8 h-8 mx-auto mb-2" />
                          <p className="text-xs">Aucun candidat desactive</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* ═══════ TAB: Centres ═══════ */}
            <TabsContent value="centers" className="space-y-4">
              <Card className="border-0 shadow-sm bg-white">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: COLORS.primaryDark }}>
                      <Building2 className="w-4 h-4" style={{ color: COLORS.yellow }} />
                      Gestion des centres agrees
                    </CardTitle>
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1" style={{ borderColor: COLORS.green, color: COLORS.green }} onClick={() => exportCSV(centresData as unknown as Record<string, unknown>[], 'centres')}>
                      <Download className="w-3 h-3" />
                      Export
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {centresData.length > 0 ? (
                    <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-white">
                          <tr className="border-b" style={{ borderColor: '#E5E7EB' }}>
                            <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Centre</th>
                            <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Region</th>
                            <th className="text-center py-3 px-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Capacite</th>
                            <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Qualite</th>
                            <th className="text-center py-3 px-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Accreditation</th>
                            <th className="text-center py-3 px-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Statut</th>
                            <th className="text-center py-3 px-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Actions</th>
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
                                <td className="py-3 px-3 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    {centre.actif ? (
                                      <>
                                        <Button
                                          variant="ghost" size="sm" className="h-6 text-[10px] px-2"
                                          style={{ color: COLORS.red }}
                                          disabled={actionLoading === centre.id}
                                          onClick={() => setConfirmModal({
                                            open: true,
                                            title: 'Suspendre le centre',
                                            message: `Etes-vous sur de vouloir suspendre "${centre.nom}" ? Ce centre ne pourra plus accueillir d'examens.`,
                                            confirmLabel: 'Suspendre',
                                            confirmColor: COLORS.red,
                                            onConfirm: () => { suspendCentre(centre.id); setConfirmModal({ ...confirmModal, open: false }); },
                                          })}
                                          title="Suspendre"
                                        >
                                          <ShieldOff className="w-3 h-3" />
                                        </Button>
                                        <Button
                                          variant="ghost" size="sm" className="h-6 text-[10px] px-2"
                                          style={{ color: '#6B7280' }}
                                          disabled={actionLoading === centre.id}
                                          onClick={() => toggleCentreActive(centre.id, true)}
                                          title="Desactiver"
                                        >
                                          <ToggleRight className="w-3 h-3" />
                                        </Button>
                                      </>
                                    ) : (
                                      <Button
                                        variant="ghost" size="sm" className="h-6 text-[10px] px-2"
                                        style={{ color: COLORS.green }}
                                        disabled={actionLoading === centre.id}
                                        onClick={() => reactivateCentre(centre.id)}
                                        title="Reactiver"
                                      >
                                        <ToggleLeft className="w-3 h-3 mr-1" />
                                        Reactiver
                                      </Button>
                                    )}
                                    {actionLoading === centre.id && <Loader2 className="w-3 h-3 animate-spin" style={{ color: COLORS.green }} />}
                                  </div>
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
                      <p className="text-sm">Aucun centre agree trouve</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ═══════ TAB: Reservations ═══════ */}
            <TabsContent value="bookings" className="space-y-4">
              <Card className="border-0 shadow-sm bg-white">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: COLORS.primaryDark }}>
                      <CalendarCheck className="w-4 h-4" style={{ color: COLORS.green }} />
                      Gestion des reservations
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <select
                        className="h-7 text-xs border border-gray-300 rounded-md px-2 bg-white"
                        value={bookingsFilter}
                        onChange={e => setBookingsFilter(e.target.value)}
                      >
                        <option value="">Tous les statuts</option>
                        <option value="en_attente">En attente</option>
                        <option value="confirme">Confirme</option>
                        <option value="echoue">Echoue</option>
                        <option value="rembourse">Rembourse</option>
                      </select>
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1" style={{ borderColor: COLORS.green, color: COLORS.green }} onClick={() => exportCSV(bookingsData as unknown as Record<string, unknown>[], 'reservations')}>
                        <Download className="w-3 h-3" />
                        Export
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {bookingsLoading ? (
                    <div className="py-12 text-center">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto" style={{ color: COLORS.green }} />
                    </div>
                  ) : bookingsData.length > 0 ? (
                    <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-white">
                          <tr className="border-b" style={{ borderColor: '#E5E7EB' }}>
                            <th className="text-left py-2 px-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Candidat</th>
                            <th className="text-left py-2 px-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Centre</th>
                            <th className="text-left py-2 px-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Date/Heure</th>
                            <th className="text-center py-2 px-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Montant</th>
                            <th className="text-center py-2 px-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Paiement</th>
                            <th className="text-center py-2 px-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Confirme</th>
                            <th className="text-center py-2 px-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bookingsData.map((booking) => {
                            const payStatus = getPaymentStatusConfig(booking.statutPaiement);
                            return (
                              <tr key={booking.id} className="border-b last:border-0 hover:bg-gray-50/50" style={{ borderColor: '#F3F4F6' }}>
                                <td className="py-2.5 px-3">
                                  <div>
                                    <p className="text-xs font-semibold" style={{ color: COLORS.primaryDark }}>{booking.candidat.prenom} {booking.candidat.nom}</p>
                                    <p className="text-[10px] text-gray-400">{booking.candidat.numeroUnique}</p>
                                  </div>
                                </td>
                                <td className="py-2.5 px-3">
                                  <div>
                                    <p className="text-xs font-medium" style={{ color: COLORS.primaryDark }}>{booking.centreNom}</p>
                                    <p className="text-[10px] text-gray-400">{booking.ville}</p>
                                  </div>
                                </td>
                                <td className="py-2.5 px-3">
                                  <p className="text-xs" style={{ color: COLORS.primaryDark }}>{booking.date}</p>
                                  <p className="text-[10px] text-gray-400">{booking.heure}</p>
                                </td>
                                <td className="py-2.5 px-3 text-center text-xs font-medium" style={{ color: COLORS.primaryDark }}>
                                  {formatCurrency(booking.montant)}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <Badge className="text-[10px] px-1.5 py-0 h-4 font-semibold" style={{ backgroundColor: payStatus.bg, color: payStatus.color }}>
                                    {payStatus.label}
                                  </Badge>
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  {booking.confirmee ? (
                                    <CheckCircle className="w-4 h-4 mx-auto" style={{ color: COLORS.green }} />
                                  ) : (
                                    <XCircle className="w-4 h-4 mx-auto" style={{ color: '#9CA3AF' }} />
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    {booking.statutPaiement === 'en_attente' && (
                                      <Button
                                        variant="ghost" size="sm" className="h-6 text-[10px] px-2"
                                        style={{ color: COLORS.green }}
                                        disabled={actionLoading === booking.id}
                                        onClick={() => updateBookingStatus(booking.id, 'confirme', true)}
                                        title="Confirmer le paiement"
                                      >
                                        <CheckCircle className="w-3 h-3" />
                                      </Button>
                                    )}
                                    {booking.statutPaiement === 'en_attente' && (
                                      <Button
                                        variant="ghost" size="sm" className="h-6 text-[10px] px-2"
                                        style={{ color: COLORS.red }}
                                        disabled={actionLoading === booking.id}
                                        onClick={() => setConfirmModal({
                                          open: true,
                                          title: 'Rejeter la reservation',
                                          message: 'Le paiement sera marque comme echoue.',
                                          confirmLabel: 'Rejeter',
                                          confirmColor: COLORS.red,
                                          onConfirm: () => { updateBookingStatus(booking.id, 'echoue'); setConfirmModal({ ...confirmModal, open: false }); },
                                        })}
                                        title="Rejeter"
                                      >
                                        <XCircle className="w-3 h-3" />
                                      </Button>
                                    )}
                                    {booking.statutPaiement === 'confirme' && !booking.confirmee && (
                                      <Button
                                        variant="ghost" size="sm" className="h-6 text-[10px] px-2"
                                        style={{ color: COLORS.green }}
                                        disabled={actionLoading === booking.id}
                                        onClick={() => updateBookingStatus(booking.id, booking.statutPaiement, true)}
                                        title="Approuver"
                                      >
                                        <Gavel className="w-3 h-3" />
                                      </Button>
                                    )}
                                    {actionLoading === booking.id && <Loader2 className="w-3 h-3 animate-spin" style={{ color: COLORS.green }} />}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="py-12 text-center text-gray-400">
                      <CalendarCheck className="w-10 h-10 mx-auto mb-2" />
                      <p className="text-sm">Aucune reservation trouvee</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ═══════ TAB: Utilisateurs ═══════ */}
            <TabsContent value="users" className="space-y-4">
              <Card className="border-0 shadow-sm bg-white">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: COLORS.primaryDark }}>
                      <UserCog className="w-4 h-4" style={{ color: COLORS.green }} />
                      Gestion des utilisateurs
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Rechercher..."
                          className="h-7 text-xs border border-gray-300 rounded-md pl-8 pr-3 bg-white w-40"
                          value={usersSearch}
                          onChange={e => setUsersSearch(e.target.value)}
                        />
                      </div>
                      <select
                        className="h-7 text-xs border border-gray-300 rounded-md px-2 bg-white"
                        value={usersRoleFilter}
                        onChange={e => setUsersRoleFilter(e.target.value)}
                      >
                        <option value="">Tous les roles</option>
                        <option value="candidat">Candidat</option>
                        <option value="auto-ecole">Auto-ecole</option>
                        <option value="centre-agree">Centre agree</option>
                        <option value="administration">Administration</option>
                        {userRole === 'super-admin' && <option value="super-admin">Super Admin</option>}
                      </select>
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1" style={{ borderColor: COLORS.green, color: COLORS.green }} onClick={() => exportCSV(usersData as unknown as Record<string, unknown>[], 'utilisateurs')}>
                        <Download className="w-3 h-3" />
                        Export
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {usersLoading ? (
                    <div className="py-12 text-center">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto" style={{ color: COLORS.green }} />
                    </div>
                  ) : usersData.length > 0 ? (
                    <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-white">
                          <tr className="border-b" style={{ borderColor: '#E5E7EB' }}>
                            <th className="text-left py-2 px-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Utilisateur</th>
                            <th className="text-left py-2 px-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Contact</th>
                            <th className="text-center py-2 px-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Role</th>
                            <th className="text-center py-2 px-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Examens</th>
                            <th className="text-center py-2 px-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Statut</th>
                            <th className="text-center py-2 px-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {usersData.map((u) => {
                            const roleConf = getRoleLabel(u.role);
                            return (
                              <tr key={u.id} className="border-b last:border-0 hover:bg-gray-50/50" style={{ borderColor: '#F3F4F6' }}>
                                <td className="py-2.5 px-3">
                                  <div>
                                    <p className="text-xs font-semibold" style={{ color: COLORS.primaryDark }}>{u.prenom} {u.nom}</p>
                                    <p className="text-[10px] text-gray-400 font-mono">{u.numeroUnique}</p>
                                  </div>
                                </td>
                                <td className="py-2.5 px-3">
                                  <div>
                                    <p className="text-[10px]" style={{ color: '#6B7280' }}>{u.email}</p>
                                    <p className="text-[10px]" style={{ color: '#9CA3AF' }}>{u.telephone}</p>
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <select
                                    className="text-[10px] border border-gray-200 rounded px-1.5 py-0.5 bg-white"
                                    value={u.role}
                                    disabled={actionLoading === u.id || (u.role === 'super-admin' && userRole !== 'super-admin')}
                                    onChange={e => changeUserRole(u.id, e.target.value)}
                                  >
                                    <option value="candidat">Candidat</option>
                                    <option value="auto-ecole">Auto-ecole</option>
                                    <option value="centre-agree">Centre agree</option>
                                    <option value="administration">Administration</option>
                                    {userRole === 'super-admin' && <option value="super-admin">Super Admin</option>}
                                  </select>
                                </td>
                                <td className="py-2.5 px-3 text-center text-xs" style={{ color: COLORS.primaryDark }}>
                                  {u._count.examSessions}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  {u.actif ? (
                                    <Badge className="text-[10px] px-1.5 py-0 h-4 font-semibold bg-green-50 text-green-700 hover:bg-green-50">Actif</Badge>
                                  ) : (
                                    <Badge className="text-[10px] px-1.5 py-0 h-4 font-semibold bg-red-50 text-red-700 hover:bg-red-50">Inactif</Badge>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <Button
                                      variant="ghost" size="sm" className="h-6 text-[10px] px-2"
                                      style={{ color: u.actif ? COLORS.red : COLORS.green }}
                                      disabled={actionLoading === u.id}
                                      onClick={() => setConfirmModal({
                                        open: true,
                                        title: u.actif ? 'Desactiver l\'utilisateur' : 'Reactiver l\'utilisateur',
                                        message: u.actif
                                          ? `Etes-vous sur de vouloir desactiver ${u.prenom} ${u.nom} ?`
                                          : `Reactiver ${u.prenom} ${u.nom} ?`,
                                        confirmLabel: u.actif ? 'Desactiver' : 'Reactiver',
                                        confirmColor: u.actif ? COLORS.red : COLORS.green,
                                        onConfirm: () => { toggleUserActive(u.id, u.actif); setConfirmModal({ ...confirmModal, open: false }); },
                                      })}
                                      title={u.actif ? 'Desactiver' : 'Reactiver'}
                                    >
                                      {u.actif ? <ToggleRight className="w-3 h-3" /> : <ToggleLeft className="w-3 h-3" />}
                                    </Button>
                                    {actionLoading === u.id && <Loader2 className="w-3 h-3 animate-spin" style={{ color: COLORS.green }} />}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="py-12 text-center text-gray-400">
                      <UserCog className="w-10 h-10 mx-auto mb-2" />
                      <p className="text-sm">Aucun utilisateur trouve</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ═══════ TAB: Journal d'audit ═══════ */}
            <TabsContent value="audit" className="space-y-4">
              <Card className="border-0 shadow-sm bg-white">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold" style={{ color: COLORS.primaryDark }}>Journal d&apos;audit</CardTitle>
                    <div className="flex items-center gap-2">
                      <select
                        value={auditFilter}
                        onChange={(e) => setAuditFilter(e.target.value)}
                        className="text-xs border rounded px-2 py-1"
                      >
                        <option value="">Tous les evenements</option>
                        <option value="AUTH_LOGIN">Connexion</option>
                        <option value="AUTH_LOGIN_FAILED">Echec connexion</option>
                        <option value="AUTH_REGISTER">Inscription</option>
                        <option value="AUTH_PASSWORD_RESET_REQUEST">Demande reset MDP</option>
                        <option value="AUTH_PASSWORD_CHANGE">Changement MDP</option>
                        <option value="USER_UPDATE">Modification utilisateur</option>
                        <option value="USER_DEACTIVATE">Desactivation utilisateur</option>
                        <option value="BOOKING_CONFIRM">Confirmation reservation</option>
                        <option value="PAYMENT_INITIATE">Paiement initie</option>
                        <option value="PAYMENT_CONFIRM">Paiement confirme</option>
                        <option value="FRAUD_INVESTIGATE">Fraude - investigation</option>
                        <option value="FRAUD_RESOLVE">Fraude - resolue</option>
                        <option value="RATE_LIMIT_EXCEEDED">Limite de debit depassee</option>
                        <option value="CSRF_VALIDATION_FAILED">Echec CSRF</option>
                        <option value="DATA_EXPORT">Export de donnees</option>
                      </select>
                      <Button size="sm" variant="outline" onClick={() => fetchAuditLogs()}>
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">{auditTotal} entrees au total</p>
                </CardHeader>
                <CardContent>
                  {auditLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    </div>
                  ) : auditLogs.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">Aucune entree d&apos;audit trouvee.</p>
                  ) : (
                    <div className="space-y-2 max-h-[600px] overflow-y-auto">
                      {auditLogs.map((log) => (
                        <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                          <div className={`mt-0.5 h-2 w-2 rounded-full flex-shrink-0 ${
                            log.severity === 'critical' ? 'bg-red-500' :
                            log.severity === 'warning' ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0" style={{
                                borderColor: log.severity === 'critical' ? COLORS.red : log.severity === 'warning' ? COLORS.yellow : COLORS.green,
                                color: log.severity === 'critical' ? COLORS.red : log.severity === 'warning' ? '#b8860b' : COLORS.green,
                              }}>
                                {log.eventType}
                              </Badge>
                              {log.userRole && (
                                <span className="text-[10px] text-gray-400">{log.userRole}</span>
                              )}
                            </div>
                            <p className="text-xs text-gray-700 mt-1">{log.description}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              {new Date(log.timestamp).toLocaleString('fr-FR')}
                              {log.ipAddress && ` | IP: ${log.ipAddress}`}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ═══════ TAB: Système (super-admin only) ═══════ */}
            <TabsContent value="system" className="space-y-4">
              <Card className="border-0 shadow-sm bg-white">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold" style={{ color: COLORS.primaryDark }}>
                    État du système
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-500">
                    Surveillance en temps réel de la santé de la plateforme (base de données, environnement, secret de session)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <HealthCheckWidget />
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg text-sm text-gray-600 space-y-1">
                    <div className="font-medium text-gray-700">Informations</div>
                    <div>• Stack : Next.js 16 + Prisma + SQLite (dev) / PostgreSQL (prod)</div>
                    <div>• Endpoint : <code className="text-xs bg-white px-1.5 py-0.5 rounded">GET /api/health</code></div>
                    <div>• L'endpoint poll toutes les 30 secondes automatiquement</div>
                    <div>
                      • Voir le JSON complet :{' '}
                      <a
                        href="/api/health"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#009460] hover:underline"
                      >
                        /api/health
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ═══════ TAB: Parametres ═══════ */}
            <TabsContent value="settings" className="space-y-4">
              <Card className="border-0 shadow-sm bg-white">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold" style={{ color: COLORS.primaryDark }}>Parametres du systeme</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-semibold mb-2" style={{ color: COLORS.primaryDark }}>Parametres generaux</h3>
                      <Separator className="mb-4" />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Nom de l&apos;organisation</p>
                          <p className="text-sm font-medium" style={{ color: COLORS.primaryDark }}>CodeRoute Guinee</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Ministere de tutelle</p>
                          <p className="text-sm font-medium" style={{ color: COLORS.primaryDark }}>Ministere des Transports</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Duree de l&apos;examen</p>
                          <p className="text-sm font-medium" style={{ color: COLORS.primaryDark }}>30 minutes</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Score de reussite</p>
                          <p className="text-sm font-medium" style={{ color: COLORS.primaryDark }}>35/40 (87.5%)</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold mb-2" style={{ color: COLORS.primaryDark }}>Langues supportees</h3>
                      <Separator className="mb-4" />
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="text-xs px-3 py-1" style={{ borderColor: COLORS.green, color: COLORS.green }}>
                          Francais (fr)
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">Soussou, Poular, Malinke -- bientot disponible</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold mb-2" style={{ color: COLORS.primaryDark }}>Paiement Mobile Money</h3>
                      <Separator className="mb-4" />
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="p-3 rounded-lg border" style={{ borderColor: '#FF6600' }}>
                          <p className="text-xs font-semibold" style={{ color: '#FF6600' }}>Orange Money</p>
                          <p className="text-[10px] text-gray-400">Prefixes: 620, 621, 622</p>
                          <p className="text-[10px] text-gray-400">USSD: #144*1#</p>
                        </div>
                        <div className="p-3 rounded-lg border" style={{ borderColor: '#E8B123' }}>
                          <p className="text-xs font-semibold" style={{ color: '#E8B123' }}>MTN Mobile Money</p>
                          <p className="text-[10px] text-gray-400">Prefixes: 626, 627, 628</p>
                          <p className="text-[10px] text-gray-400">USSD: *156*1#</p>
                        </div>
                        <div className="p-3 rounded-lg border" style={{ borderColor: '#00A0E3' }}>
                          <p className="text-xs font-semibold" style={{ color: '#00A0E3' }}>Celcom Money</p>
                          <p className="text-[10px] text-gray-400">Prefixes: 623, 624, 625</p>
                          <p className="text-[10px] text-gray-400">USSD: *400*1#</p>
                        </div>
                      </div>
                    </div>
                    {/* ─── Change Password ─── */}
                    <div>
                      <h3 className="text-sm font-semibold mb-2" style={{ color: COLORS.primaryDark }}>Changer votre mot de passe</h3>
                      <Separator className="mb-4" />
                      <div className="max-w-md space-y-3">
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Mot de passe actuel</label>
                          <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full text-sm border rounded px-3 py-2"
                            placeholder="Mot de passe actuel"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Nouveau mot de passe</label>
                          <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full text-sm border rounded px-3 py-2"
                            placeholder="Min. 8 caracteres, 1 majuscule, 1 minuscule, 1 chiffre"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Confirmer le nouveau mot de passe</label>
                          <input
                            type="password"
                            value={confirmNewPassword}
                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                            className="w-full text-sm border rounded px-3 py-2"
                            placeholder="Ressaisir le nouveau mot de passe"
                          />
                        </div>
                        {passwordChangeMessage && (
                          <p className={`text-xs ${passwordChangeMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                            {passwordChangeMessage.text}
                          </p>
                        )}
                        <Button
                          size="sm"
                          onClick={handleChangePassword}
                          disabled={passwordChangeLoading || !currentPassword || !newPassword || !confirmNewPassword}
                          style={{ backgroundColor: COLORS.green }}
                          className="text-white"
                        >
                          {passwordChangeLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />}
                          Changer le mot de passe
                        </Button>
                      </div>
                    </div>

                    {/* ─── 2FA Management ─── */}
                    <div>
                      <h3 className="text-sm font-semibold mb-2" style={{ color: COLORS.primaryDark }}>
                        Authentification à deux facteurs (2FA)
                      </h3>
                      <Separator className="mb-4" />
                      <TwoFactorSettings />
                    </div>

                    {/* ─── Database Backup ─── */}
                    {userRole === 'super-admin' && (
                      <div>
                        <h3 className="text-sm font-semibold mb-2" style={{ color: COLORS.primaryDark }}>Sauvegarde de la base de donnees</h3>
                        <Separator className="mb-4" />
                        <p className="text-xs text-gray-500 mb-3">Creer une sauvegarde complete de la base de donnees. Les sauvegardes sont conservees pendant 30 jours.</p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            try {
                              const res = await apiFetch('/api/admin/backup', { method: 'POST' });
                              const data = await res.json();
                              alert(res.ok ? 'Sauvegarde creee avec succes.' : data.error || 'Erreur lors de la sauvegarde.');
                            } catch { alert('Erreur de connexion.'); }
                          }}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Creer une sauvegarde
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* ─── Modals ─── */}
      <ConfirmModal
        open={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        confirmColor={confirmModal.confirmColor}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ ...confirmModal, open: false })}
      />
      <NotesModal
        open={notesModal.open}
        title={notesModal.title}
        onConfirm={notesModal.onConfirm}
        onCancel={() => setNotesModal({ open: false, title: '', onConfirm: () => {} })}
      />
    </div>
  );
}
