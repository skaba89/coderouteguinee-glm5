'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth-context';
import {
  Loader2, RefreshCw, Send, Mail, MessageSquare, CheckCircle,
  XCircle, Clock, AlertCircle, Bell,
} from 'lucide-react';

const COLORS = {
  primaryDark: '#1A2332',
  red: '#CE1126',
  yellow: '#FCD116',
  green: '#009460',
};

interface NotificationLog {
  id: string;
  type: string;
  template: string;
  recipient: string;
  subject: string | null;
  body: string;
  status: string;
  provider: string | null;
  error: string | null;
  sentAt: string | null;
  createdAt: string;
}

interface Config {
  email: { configured: boolean; mode: string; host: string | null; from: string };
  sms: { configured: boolean; provider: string; senderId: string };
}

interface Stats {
  totalSent: number;
  totalFailed: number;
  last24h: number;
  byTemplate: { template: string; count: number }[];
}

export function NotificationsManager() {
  const { apiFetch } = useAuth();
  const [config, setConfig] = useState<Config | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');

  // Test notification form
  const [testChannel, setTestChannel] = useState<'email' | 'sms'>('email');
  const [testRecipient, setTestRecipient] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [statusRes, histRes] = await Promise.all([
        apiFetch('/api/admin/notifications/status'),
        apiFetch(`/api/admin/notifications?limit=50${filterStatus ? `&status=${filterStatus}` : ''}`),
      ]);
      if (statusRes.ok) {
        const sData = await statusRes.json();
        setConfig(sData.config);
        setStats(sData.stats);
      }
      if (histRes.ok) {
        const hData = await histRes.json();
        setLogs(hData.logs || []);
        setTotal(hData.total || 0);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [apiFetch, filterStatus]);

  useEffect(() => { load(); }, [load]);

  const sendTest = async () => {
    setTestResult(null);
    if (!testRecipient.trim()) {
      setTestResult({ type: 'error', text: 'Destinataire requis' });
      return;
    }
    setSendingTest(true);
    try {
      const res = await apiFetch('/api/admin/notifications/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: testChannel, recipient: testRecipient.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Erreur');
      }
      setTestResult({ type: data.success ? 'success' : 'error', text: data.message });
      if (data.success) {
        // Reload to show the new log entry
        setTimeout(() => load(), 500);
      }
    } catch (e: unknown) {
      setTestResult({ type: 'error', text: e instanceof Error ? e.message : 'Erreur' });
    } finally {
      setSendingTest(false);
    }
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return iso; }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge className="text-[10px] bg-green-50 text-green-700"><CheckCircle className="w-3 h-3 mr-1" />Envoyé</Badge>;
      case 'failed':
        return <Badge className="text-[10px] bg-red-50 text-red-700"><XCircle className="w-3 h-3 mr-1" />Échoué</Badge>;
      case 'pending':
        return <Badge className="text-[10px] bg-yellow-50 text-yellow-700"><Clock className="w-3 h-3 mr-1" />En attente</Badge>;
      default:
        return <Badge className="text-[10px]">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto" style={{ color: COLORS.green }} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ─── Configuration & Stats ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Email config */}
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: COLORS.primaryDark }}>
              <Mail className="w-4 h-4" style={{ color: COLORS.green }} />
              Email
            </CardTitle>
          </CardHeader>
          <CardContent>
            {config?.email.configured ? (
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-600" />
                  <span className="text-green-700 font-semibold">Configuré</span>
                  <Badge variant="outline" className="text-[10px] ml-auto">{config.email.mode}</Badge>
                </div>
                <p className="text-[10px] text-gray-500">Hôte: {config.email.host || 'N/A'}</p>
                <p className="text-[10px] text-gray-500">Expéditeur: {config.email.from}</p>
              </div>
            ) : (
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-3 h-3 text-yellow-600" />
                  <span className="text-yellow-700 font-semibold">Mode console (fallback)</span>
                </div>
                <p className="text-[10px] text-gray-500">
                  SMTP_HOST non configuré. Les emails sont loggés dans la console serveur au lieu d&apos;être envoyés réellement.
                  Configurez SMTP_HOST, SMTP_USER, SMTP_PASS dans .env pour activer l&apos;envoi réel.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* SMS config */}
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: COLORS.primaryDark }}>
              <MessageSquare className="w-4 h-4" style={{ color: COLORS.green }} />
              SMS
            </CardTitle>
          </CardHeader>
          <CardContent>
            {config?.sms.configured ? (
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-600" />
                  <span className="text-green-700 font-semibold">Configuré</span>
                  <Badge variant="outline" className="text-[10px] ml-auto">{config.sms.provider}</Badge>
                </div>
                <p className="text-[10px] text-gray-500">Sender ID: {config.sms.senderId}</p>
              </div>
            ) : (
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-3 h-3 text-yellow-600" />
                  <span className="text-yellow-700 font-semibold">Mode console (fallback)</span>
                </div>
                <p className="text-[10px] text-gray-500">
                  Provider: <code className="bg-gray-100 px-1 rounded">{config?.sms.provider || 'console'}</code>.
                  Les SMS sont loggés dans la console serveur. Configurez SMS_PROVIDER et SMS_API_KEY pour activer l&apos;envoi réel.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─── Stats ─── */}
      {stats && (
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: COLORS.primaryDark }}>
              <Bell className="w-4 h-4" style={{ color: COLORS.green }} />
              Statistiques
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-green-50 rounded-md">
                <p className="text-2xl font-bold" style={{ color: COLORS.green }}>{stats.totalSent}</p>
                <p className="text-[10px] text-gray-600 uppercase tracking-wider mt-1">Envoyés</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-md">
                <p className="text-2xl font-bold" style={{ color: COLORS.red }}>{stats.totalFailed}</p>
                <p className="text-[10px] text-gray-600 uppercase tracking-wider mt-1">Échoués</p>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-md">
                <p className="text-2xl font-bold" style={{ color: COLORS.yellow }}>{stats.last24h}</p>
                <p className="text-[10px] text-gray-600 uppercase tracking-wider mt-1">Dernières 24h</p>
              </div>
            </div>
            {stats.byTemplate.length > 0 && (
              <div className="mt-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-2">Par template</p>
                <div className="flex flex-wrap gap-1.5">
                  {stats.byTemplate.map(t => (
                    <Badge key={t.template} variant="outline" className="text-[10px]">
                      {t.template}: {t.count}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── Test notification ─── */}
      <Card className="border-0 shadow-sm bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: COLORS.primaryDark }}>
            <Send className="w-4 h-4" style={{ color: COLORS.green }} />
            Envoyer une notification de test
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2 flex-wrap">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">Canal</label>
              <select
                className="h-8 text-xs border border-gray-300 rounded-md px-2 bg-white"
                value={testChannel}
                onChange={e => setTestChannel(e.target.value as 'email' | 'sms')}
              >
                <option value="email">Email</option>
                <option value="sms">SMS</option>
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
                {testChannel === 'email' ? 'Adresse email' : 'Numéro de téléphone'}
              </label>
              <input
                type="text"
                className="w-full h-8 text-xs border border-gray-300 rounded-md px-2"
                placeholder={testChannel === 'email' ? 'test@example.com' : '622000000'}
                value={testRecipient}
                onChange={e => setTestRecipient(e.target.value)}
              />
            </div>
            <Button
              size="sm"
              className="h-8 text-xs gap-1"
              style={{ background: COLORS.green, color: 'white' }}
              onClick={sendTest}
              disabled={sendingTest}
            >
              {sendingTest ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
              Envoyer
            </Button>
          </div>
          {testResult && (
            <div className={`mt-3 p-2 rounded text-xs ${testResult.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {testResult.text}
            </div>
          )}
          <p className="mt-2 text-[10px] text-gray-500">
            ℹ️ En mode console, le contenu de la notification s&apos;affiche dans les logs du serveur Next.js (terminal où <code>npm run dev</code> tourne).
          </p>
        </CardContent>
      </Card>

      {/* ─── History ─── */}
      <Card className="border-0 shadow-sm bg-white">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: COLORS.primaryDark }}>
              <Bell className="w-4 h-4" style={{ color: COLORS.green }} />
              Historique des notifications
              <Badge variant="outline" className="ml-2 text-[10px]">{total}</Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              <select
                className="h-7 text-xs border border-gray-300 rounded-md px-2 bg-white"
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
              >
                <option value="">Tous statuts</option>
                <option value="sent">Envoyés</option>
                <option value="failed">Échoués</option>
                <option value="pending">En attente</option>
              </select>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={load}>
                <RefreshCw className="w-3 h-3" />
                Actualiser
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {logs.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <Bell className="w-10 h-10 mx-auto mb-2" />
              <p className="text-sm">Aucune notification trouvée</p>
              <p className="text-[10px] mt-1">Les notifications envoyées (inscriptions, paiements, rappels) apparaîtront ici.</p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white z-10">
                  <tr className="border-b" style={{ borderColor: '#E5E7EB' }}>
                    <th className="text-left py-2 px-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Date</th>
                    <th className="text-left py-2 px-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Type</th>
                    <th className="text-left py-2 px-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Destinataire</th>
                    <th className="text-left py-2 px-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Template</th>
                    <th className="text-center py-2 px-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Statut</th>
                    <th className="text-left py-2 px-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Provider</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b last:border-0 hover:bg-gray-50/50" style={{ borderColor: '#F3F4F6' }}>
                      <td className="py-2 px-3 text-[10px]" style={{ color: '#6B7280' }}>{formatDate(log.createdAt)}</td>
                      <td className="py-2 px-3">
                        {log.type === 'email' ? <Mail className="w-3 h-3" style={{ color: COLORS.green }} /> : <MessageSquare className="w-3 h-3" style={{ color: COLORS.yellow }} />}
                      </td>
                      <td className="py-2 px-3 text-[10px] font-mono" style={{ color: COLORS.primaryDark }}>{log.recipient}</td>
                      <td className="py-2 px-3 text-[10px]">{log.template}</td>
                      <td className="py-2 px-3 text-center">{getStatusBadge(log.status)}</td>
                      <td className="py-2 px-3 text-[10px] text-gray-500">{log.provider || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
