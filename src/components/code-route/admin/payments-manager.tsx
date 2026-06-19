'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth-context';
import {
  Search, RefreshCw, Loader2, Smartphone, Banknote, CreditCard,
  CheckCircle, Clock, XCircle, RotateCcw, Wallet, TrendingUp,
} from 'lucide-react';

const COLORS = {
  primaryDark: '#1A2332',
  red: '#CE1126',
  yellow: '#FCD116',
  green: '#009460',
};

interface Booking {
  id: string;
  candidatId: string;
  centreId: string;
  centreNom: string;
  date: string;
  heure: string;
  montant: number;
  moyenPaiement: string;
  numeroPaiement: string | null;
  referencePaiement: string | null;
  statutPaiement: string;
  createdAt: string;
  candidat: { id: string; nom: string; prenom: string; numeroUnique: string; telephone: string; email: string };
  centre: { id: string; nom: string; ville: string; region: string };
}

interface Stats {
  total: number;
  confirmed: number;
  pending: number;
  failed: number;
  refunded: number;
  revenue: number;
  byMethod: { mobile_money: number; cash: number; carte: number };
}

const STATUTS = [
  { value: '', label: 'Tous', color: '' },
  { value: 'confirme', label: 'Confirmé', color: 'bg-green-50 text-green-700' },
  { value: 'en_attente', label: 'En attente', color: 'bg-yellow-50 text-yellow-700' },
  { value: 'echoue', label: 'Échoué', color: 'bg-red-50 text-red-700' },
  { value: 'rembourse', label: 'Remboursé', color: 'bg-gray-100 text-gray-700' },
];

export function PaymentsManager({ canRefund = false }: { canRefund?: boolean }) {
  const { apiFetch } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Refund modal
  const [refundTarget, setRefundTarget] = useState<Booking | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [refunding, setRefunding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (filterStatus) params.set('statutPaiement', filterStatus);
      params.set('page', String(page));
      params.set('limit', '50');

      const res = await apiFetch(`/api/admin/payments?${params.toString()}`);
      if (!res.ok) throw new Error('Erreur');
      const data = await res.json();
      setBookings(data.bookings || []);
      setStats(data.stats || null);
      setTotal(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [apiFetch, search, filterStatus, page]);

  useEffect(() => { load(); }, [load]);

  const handleRefund = async () => {
    if (!refundTarget) return;
    setRefunding(true);
    try {
      const res = await apiFetch(`/api/admin/payments/${refundTarget.id}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: refundReason || 'Non spécifié' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Erreur');
      setRefundTarget(null);
      setRefundReason('');
      load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setRefunding(false);
    }
  };

  const formatMoney = (gnf: number) => new Intl.NumberFormat('fr-FR').format(gnf) + ' GNF';
  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    } catch { return iso; }
  };

  const getStatusBadge = (s: string) => {
    const conf = STATUTS.find(x => x.value === s);
    return <Badge className={`text-[10px] ${conf?.color || 'bg-gray-100'}`}>{conf?.label || s}</Badge>;
  };

  const getMethodIcon = (m: string) => {
    if (m === 'mobile_money') return <Smartphone className="w-3 h-3" style={{ color: COLORS.green }} />;
    if (m === 'cash') return <Banknote className="w-3 h-3" style={{ color: COLORS.yellow }} />;
    if (m === 'carte') return <CreditCard className="w-3 h-3" style={{ color: COLORS.primaryDark }} />;
    return null;
  };

  return (
    <div className="space-y-4">
      {/* ─── Stats cards ─── */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="border-0 shadow-sm bg-white p-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
                <Wallet className="w-4 h-4" style={{ color: COLORS.green }} />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Revenu</p>
                <p className="text-sm font-bold" style={{ color: COLORS.green }}>{formatMoney(stats.revenue)}</p>
              </div>
            </div>
          </Card>
          <Card className="border-0 shadow-sm bg-white p-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Confirmés</p>
                <p className="text-sm font-bold" style={{ color: COLORS.primaryDark }}>{stats.confirmed}</p>
              </div>
            </div>
          </Card>
          <Card className="border-0 shadow-sm bg-white p-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-yellow-50 flex items-center justify-center">
                <Clock className="w-4 h-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">En attente</p>
                <p className="text-sm font-bold" style={{ color: COLORS.primaryDark }}>{stats.pending}</p>
              </div>
            </div>
          </Card>
          <Card className="border-0 shadow-sm bg-white p-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
                <XCircle className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Échoués / Remboursés</p>
                <p className="text-sm font-bold" style={{ color: COLORS.primaryDark }}>{stats.failed} / {stats.refunded}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ─── Method breakdown ─── */}
      {stats && (
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: COLORS.primaryDark }}>
              <TrendingUp className="w-4 h-4" style={{ color: COLORS.green }} />
              Paiements par méthode
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 flex-wrap text-xs">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4" style={{ color: COLORS.green }} />
                <span style={{ color: COLORS.primaryDark }}>Mobile Money: <strong>{stats.byMethod.mobile_money}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Banknote className="w-4 h-4" style={{ color: COLORS.yellow }} />
                <span style={{ color: COLORS.primaryDark }}>Cash: <strong>{stats.byMethod.cash}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" style={{ color: COLORS.primaryDark }} />
                <span style={{ color: COLORS.primaryDark }}>Carte: <strong>{stats.byMethod.carte}</strong></span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Bookings table ─── */}
      <Card className="border-0 shadow-sm bg-white">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: COLORS.primaryDark }}>
              <Wallet className="w-4 h-4" style={{ color: COLORS.green }} />
              Transactions
              <Badge variant="outline" className="ml-2 text-[10px]">{total}</Badge>
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher (réf, candidat, n° MoMo)..."
                  className="h-7 text-xs border border-gray-300 rounded-md pl-8 pr-3 bg-white w-56"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                />
              </div>
              <select
                className="h-7 text-xs border border-gray-300 rounded-md px-2 bg-white"
                value={filterStatus}
                onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
              >
                {STATUTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={load}>
                <RefreshCw className="w-3 h-3" />
                Actualiser
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {loading ? (
            <div className="py-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto" style={{ color: COLORS.green }} />
            </div>
          ) : bookings.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <Wallet className="w-10 h-10 mx-auto mb-2" />
              <p className="text-sm">Aucune transaction trouvée</p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white z-10">
                  <tr className="border-b" style={{ borderColor: '#E5E7EB' }}>
                    <th className="text-left py-2 px-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Date</th>
                    <th className="text-left py-2 px-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Candidat</th>
                    <th className="text-left py-2 px-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Centre</th>
                    <th className="text-center py-2 px-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Méthode</th>
                    <th className="text-center py-2 px-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Montant</th>
                    <th className="text-left py-2 px-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Référence</th>
                    <th className="text-center py-2 px-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Statut</th>
                    {canRefund && <th className="text-center py-2 px-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b.id} className="border-b last:border-0 hover:bg-gray-50/50" style={{ borderColor: '#F3F4F6' }}>
                      <td className="py-2.5 px-3 text-[10px]" style={{ color: '#6B7280' }}>{formatDate(b.createdAt)}</td>
                      <td className="py-2.5 px-3">
                        <p className="text-xs font-semibold" style={{ color: COLORS.primaryDark }}>{b.candidat.prenom} {b.candidat.nom}</p>
                        <p className="text-[10px] text-gray-400 font-mono">{b.candidat.numeroUnique}</p>
                      </td>
                      <td className="py-2.5 px-3 text-[10px]" style={{ color: '#6B7280' }}>{b.centre.nom}</td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1 text-[10px]">
                          {getMethodIcon(b.moyenPaiement)}
                          <span style={{ color: '#6B7280' }}>{b.moyenPaiement === 'mobile_money' ? 'MoMo' : b.moyenPaiement}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center text-xs font-semibold" style={{ color: COLORS.green }}>{formatMoney(b.montant)}</td>
                      <td className="py-2.5 px-3 text-[10px] font-mono" style={{ color: '#6B7280' }}>
                        {b.referencePaiement || (b.numeroPaiement ? `MoMo: ${b.numeroPaiement}` : '-')}
                      </td>
                      <td className="py-2.5 px-3 text-center">{getStatusBadge(b.statutPaiement)}</td>
                      {canRefund && (
                        <td className="py-2.5 px-3 text-center">
                          {b.statutPaiement === 'confirme' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-[10px] gap-1"
                              style={{ color: COLORS.red }}
                              onClick={() => { setRefundTarget(b); setRefundReason(''); }}
                            >
                              <RotateCcw className="w-3 h-3" />
                              Rembourser
                            </Button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 px-2">
                  <p className="text-[10px] text-gray-500">Page {page} / {totalPages}</p>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)} className="h-7 text-xs">Précédent</Button>
                    <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="h-7 text-xs">Suivant</Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Refund modal ─── */}
      {refundTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                <RotateCcw className="w-5 h-5" style={{ color: COLORS.red }} />
              </div>
              <h3 className="text-sm font-semibold" style={{ color: COLORS.primaryDark }}>Rembourser le paiement ?</h3>
            </div>
            <div className="bg-gray-50 rounded p-3 mb-3 text-xs space-y-1">
              <div className="flex justify-between"><span className="text-gray-500">Candidat:</span> <span style={{ color: COLORS.primaryDark }}>{refundTarget.candidat.prenom} {refundTarget.candidat.nom}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Montant:</span> <span style={{ color: COLORS.green }} className="font-bold">{formatMoney(refundTarget.montant)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Référence:</span> <span className="font-mono">{refundTarget.referencePaiement || refundTarget.id}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Centre:</span> <span>{refundTarget.centre.nom}</span></div>
            </div>
            <div className="mb-4">
              <label className="block text-[11px] font-semibold mb-1" style={{ color: COLORS.primaryDark }}>Raison du remboursement</label>
              <textarea
                className="w-full text-xs border border-gray-300 rounded-md p-2 min-h-[60px]"
                value={refundReason}
                onChange={e => setRefundReason(e.target.value)}
                placeholder="Ex: Annulation demandée par le candidat, erreur technique, etc."
              />
            </div>
            <p className="text-[10px] text-gray-500 mb-4">
              ⚠️ Cette action marquera le paiement comme <strong>remboursé</strong>. En mode sandbox (sans clé API MoMo réelle), aucun remboursement réel n&apos;est effectué côté opérateur — seul le statut local change.
            </p>
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setRefundTarget(null)} className="text-xs">Annuler</Button>
              <Button size="sm" onClick={handleRefund} disabled={refunding} className="text-xs gap-1" style={{ background: COLORS.red, color: 'white' }}>
                {refunding ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                Confirmer le remboursement
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
