'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/lib/auth-context'
import { ViewType } from '@/lib/types'
import { TwoFactorSettings } from './two-factor-settings'
import {
  Calendar,
  CheckCircle,
  XCircle,
  DollarSign,
  Users,
  Loader2,
  TrendingUp,
  Clock,
} from 'lucide-react'

interface Props {
  onViewChange?: (view: ViewType) => void
}

interface Booking {
  id: string
  candidatId: string
  centreNom: string
  date: string
  heure: string
  langue: string
  categoriePermis: string
  montant: number
  statutPaiement: string
  confirmee: boolean
  numeroConvocation: string | null
  candidat: {
    id: string
    nom: string
    prenom: string
    email: string
    telephone: string
    numeroUnique: string
    categoriePermis: string
  }
}

interface Kpi {
  totalBookings: number
  confirmedBookings: number
  pendingBookings: number
  todayBookings: number
  totalRevenue: number
}

interface ScheduleItem {
  id: string
  date: string
  heure: string
  candidat: string
  numeroUnique: string
  categoriePermis: string
  langue: string
}

interface MonthlyData {
  month: string
  bookings: number
  revenue: number
}

const PASS_THRESHOLD = 0.875 // 87.5%

export default function CentreDashboard({ onViewChange }: Props) {
  const { apiFetch } = useAuth()
  const [tab, setTab] = useState<'overview' | 'bookings' | 'schedule' | 'analytics'>('overview')

  const [kpi, setKpi] = useState<Kpi | null>(null)
  const [schedule, setSchedule] = useState<ScheduleItem[]>([])
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingBookings, setLoadingBookings] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Exam result dialog state
  const [resultOpen, setResultOpen] = useState(false)
  const [resultBooking, setResultBooking] = useState<Booking | null>(null)
  const [score, setScore] = useState('')
  const [totalQuestions, setTotalQuestions] = useState('40')
  const [submittingResult, setSubmittingResult] = useState(false)

  // ─── Load KPIs + schedule + monthly ────────────────────
  const loadStats = useCallback(async () => {
    try {
      const res = await apiFetch('/api/centre/stats')
      if (res.ok) {
        const data = await res.json()
        setKpi(data.kpi)
        setSchedule(data.upcomingSchedule || [])
        setMonthlyData(data.monthlyData || [])
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [apiFetch])

  // ─── Load bookings ─────────────────────────────────────
  const loadBookings = useCallback(async () => {
    setLoadingBookings(true)
    try {
      const res = await apiFetch('/api/centre/bookings?limit=100')
      if (res.ok) {
        const data = await res.json()
        setBookings(data.bookings || [])
      }
    } catch {
      // silent
    } finally {
      setLoadingBookings(false)
    }
  }, [apiFetch])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  useEffect(() => {
    if (tab === 'bookings') loadBookings()
  }, [tab, loadBookings])

  // ─── Confirm/reject booking ────────────────────────────
  async function handleBookingAction(bookingId: string, action: 'confirm' | 'reject') {
    setActionLoading(bookingId)
    setError(null)
    try {
      const res = await apiFetch('/api/centre/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, action }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Erreur' }))
        setError(data.error || 'Erreur lors de l\'action')
        return
      }
      // Refresh
      loadBookings()
      loadStats()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur réseau')
    } finally {
      setActionLoading(null)
    }
  }

  // ─── Open exam result dialog ───────────────────────────
  function openResultDialog(booking: Booking) {
    setResultBooking(booking)
    setScore('')
    setTotalQuestions('40')
    setResultOpen(true)
  }

  // ─── Submit exam result ────────────────────────────────
  async function handleSubmitResult(e: React.FormEvent) {
    e.preventDefault()
    if (!resultBooking) return

    const scoreNum = parseInt(score)
    const totalNum = parseInt(totalQuestions)
    if (isNaN(scoreNum) || isNaN(totalNum) || scoreNum < 0 || scoreNum > totalNum) {
      setError('Score invalide')
      return
    }

    setSubmittingResult(true)
    setError(null)
    try {
      // Note: in a real system, the booking would link to an ExamSession.
      // For MVP, we look up the ExamSession by candidatId + date.
      const sessionsRes = await apiFetch(`/api/exams/candidate`)
      if (sessionsRes.ok) {
        const sessionsData = await sessionsRes.json()
        const matchingSession = (sessionsData.sessions || []).find(
          (s: { candidatId: string; date: string; id: string }) =>
            s.candidatId === resultBooking.candidatId && s.date === resultBooking.date
        )
        if (matchingSession) {
          await apiFetch('/api/centre/exam-results', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: matchingSession.id,
              score: scoreNum,
              totalQuestions: totalNum,
            }),
          })
        }
      }
      setResultOpen(false)
      setResultBooking(null)
      loadBookings()
      loadStats()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur réseau')
    } finally {
      setSubmittingResult(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#009460]" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord Centre agréé</h1>
        <p className="text-gray-500 text-sm">Gérez les réservations et saisissez les résultats d'examens</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b overflow-x-auto">
        {[
          { id: 'overview' as const, label: 'Vue d\'ensemble', icon: TrendingUp },
          { id: 'bookings' as const, label: 'Réservations', icon: Users },
          { id: 'schedule' as const, label: 'Planning', icon: Calendar },
          { id: 'analytics' as const, label: 'Statistiques', icon: DollarSign },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              tab === t.id
                ? 'border-[#009460] text-[#009460]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── Overview tab ─── */}
      {tab === 'overview' && kpi && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard label="Réservations" value={kpi.totalBookings} icon={Users} color="bg-blue-500" />
            <KpiCard label="Confirmées" value={kpi.confirmedBookings} icon={CheckCircle} color="bg-green-500" />
            <KpiCard label="En attente" value={kpi.pendingBookings} icon={Clock} color="bg-orange-500" />
            <KpiCard
              label="Revenus"
              value={`${kpi.totalRevenue.toLocaleString('fr-FR')} GNF`}
              icon={DollarSign}
              color="bg-purple-500"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Examens aujourd'hui</CardTitle>
              <CardDescription>Réservations confirmées pour aujourd'hui</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#009460]">{kpi.todayBookings}</div>
            </CardContent>
          </Card>

          <TwoFactorSettings />
        </div>
      )}

      {/* ─── Bookings tab ─── */}
      {tab === 'bookings' && (
        <div className="space-y-4">
          {loadingBookings ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : bookings.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                Aucune réservation
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Candidat</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Heure</TableHead>
                      <TableHead>Cat.</TableHead>
                      <TableHead>Paiement</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell>
                          <div className="font-medium">{b.candidat.prenom} {b.candidat.nom}</div>
                          <div className="text-xs text-gray-500 font-mono">{b.candidat.numeroUnique}</div>
                        </TableCell>
                        <TableCell className="text-sm">{new Date(b.date).toLocaleDateString('fr-FR')}</TableCell>
                        <TableCell className="text-sm font-mono">{b.heure}</TableCell>
                        <TableCell><Badge variant="outline">{b.categoriePermis}</Badge></TableCell>
                        <TableCell>
                          {b.statutPaiement === 'confirme' ? (
                            <Badge variant="default" className="bg-green-600">Confirmé</Badge>
                          ) : b.statutPaiement === 'en_attente' ? (
                            <Badge variant="secondary">En attente</Badge>
                          ) : (
                            <Badge variant="destructive">Échoué</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {!b.confirmee && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs border-green-500 text-green-700 hover:bg-green-50"
                                  onClick={() => handleBookingAction(b.id, 'confirm')}
                                  disabled={actionLoading === b.id}
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Confirmer
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs border-red-500 text-red-700 hover:bg-red-50"
                                  onClick={() => handleBookingAction(b.id, 'reject')}
                                  disabled={actionLoading === b.id}
                                >
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Rejeter
                                </Button>
                              </>
                            )}
                            {b.confirmee && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                onClick={() => openResultDialog(b)}
                              >
                                Saisir résultat
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ─── Schedule tab ─── */}
      {tab === 'schedule' && (
        <Card>
          <CardHeader>
            <CardTitle>Planning (7 prochains jours)</CardTitle>
            <CardDescription>Examens confirmés à venir</CardDescription>
          </CardHeader>
          <CardContent>
            {schedule.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Aucun examen programmé</p>
            ) : (
              <div className="space-y-2">
                {schedule.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-center p-2 bg-[#009460] text-white rounded-lg min-w-14">
                        <div className="text-xs">
                          {new Date(item.date).toLocaleDateString('fr-FR', { weekday: 'short' })}
                        </div>
                        <div className="text-lg font-bold">
                          {new Date(item.date).getDate()}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium">{item.candidat}</div>
                        <div className="text-xs text-gray-500 font-mono">{item.numeroUnique}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm">{item.heure}</div>
                      <div className="text-xs text-gray-500">
                        {item.categoriePermis} · {item.langue.toUpperCase()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── Analytics tab ─── */}
      {tab === 'analytics' && (
        <Card>
          <CardHeader>
            <CardTitle>Revenus mensuels (6 derniers mois)</CardTitle>
            <CardDescription>Volume de réservations confirmées et revenus</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {monthlyData.map((m) => (
                <div key={m.month} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{m.month}</span>
                    <span className="text-gray-500">
                      {m.bookings} réservation(s) · {m.revenue.toLocaleString('fr-FR')} GNF
                    </span>
                  </div>
                  <div className="relative h-6 bg-gray-100 rounded">
                    <div
                      className="absolute h-full bg-[#009460] rounded"
                      style={{ width: `${Math.min(100, (m.bookings / 50) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Exam result dialog ─── */}
      <Dialog open={resultOpen} onOpenChange={setResultOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Saisir le résultat d'examen</DialogTitle>
            <DialogDescription>
              {resultBooking && (
                <>
                  Candidat : <strong>{resultBooking.candidat.prenom} {resultBooking.candidat.nom}</strong>
                  <br />
                  Date : {new Date(resultBooking.date).toLocaleDateString('fr-FR')} à {resultBooking.heure}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitResult} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="score">Score</Label>
                <Input
                  id="score"
                  type="number"
                  min="0"
                  max={totalQuestions}
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="total">Total questions</Label>
                <Input
                  id="total"
                  type="number"
                  min="1"
                  max="100"
                  value={totalQuestions}
                  onChange={(e) => setTotalQuestions(e.target.value)}
                  required
                />
              </div>
            </div>
            {score && totalQuestions && !isNaN(parseInt(score)) && !isNaN(parseInt(totalQuestions)) && (
              <div className="p-3 bg-gray-50 rounded-lg text-sm">
                <div className="flex justify-between mb-1">
                  <span>Pourcentage :</span>
                  <span className="font-bold">
                    {Math.round((parseInt(score) / parseInt(totalQuestions)) * 100)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Résultat prévu :</span>
                  <span className={`font-bold ${parseInt(score) / parseInt(totalQuestions) >= PASS_THRESHOLD ? 'text-green-600' : 'text-red-600'}`}>
                    {parseInt(score) / parseInt(totalQuestions) >= PASS_THRESHOLD ? 'RÉUSSI' : 'ÉCHOUÉ'}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Seuil de réussite : {Math.round(PASS_THRESHOLD * 100)}%
                </div>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setResultOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={submittingResult} className="bg-[#009460] hover:bg-[#007a4d]">
                {submittingResult ? 'Enregistrement...' : 'Enregistrer le résultat'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── KPI Card subcomponent ──────────────────────────────
function KpiCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  color: string
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}
