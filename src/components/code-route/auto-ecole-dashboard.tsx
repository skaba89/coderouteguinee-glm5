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
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAuth } from '@/lib/auth-context'
import { ViewType } from '@/lib/types'
import { TwoFactorSettings } from './two-factor-settings'
import {
  Users,
  GraduationCap,
  TrendingUp,
  Calendar,
  Search,
  Download,
  Plus,
  Loader2,
  Copy,
  Check,
  UserPlus,
} from 'lucide-react'

interface Props {
  onViewChange?: (view: ViewType) => void
}

interface Student {
  id: string
  nom: string
  prenom: string
  email: string
  telephone: string
  numeroUnique: string
  ville: string
  categoriePermis: string
  actif: boolean
  createdAt: string
}

interface Kpi {
  totalStudents: number
  activeStudents: number
  totalExams: number
  passedExams: number
  successRate: number
  upcomingExams: number
}

interface MonthlyData {
  month: string
  exams: number
  passed: number
}

const MAX_CHART_VALUE = 20 // for bar chart scale

export default function AutoEcoleDashboard({ onViewChange }: Props) {
  const { apiFetch } = useAuth()
  const [tab, setTab] = useState<'overview' | 'students' | 'analytics'>('overview')

  const [kpi, setKpi] = useState<Kpi | null>(null)
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingStudents, setLoadingStudents] = useState(false)

  // Add-student dialog state
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState({
    email: '', nom: '', prenom: '', dateNaissance: '', numeroIdentite: '',
    telephone: '', ville: 'Conakry', region: 'Conakry', categoriePermis: 'B',
  })
  const [submitting, setSubmitting] = useState(false)
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ─── Load KPIs ─────────────────────────────────────────
  const loadKpis = useCallback(async () => {
    try {
      const res = await apiFetch('/api/auto-ecole/stats')
      if (res.ok) {
        const data = await res.json()
        setKpi(data.kpi)
        setMonthlyData(data.monthlyData || [])
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [apiFetch])

  // ─── Load students ─────────────────────────────────────
  const loadStudents = useCallback(async () => {
    setLoadingStudents(true)
    try {
      const url = `/api/auto-ecole/students?limit=100${search ? `&search=${encodeURIComponent(search)}` : ''}`
      const res = await apiFetch(url)
      if (res.ok) {
        const data = await res.json()
        setStudents(data.students || [])
      }
    } catch {
      // silent
    } finally {
      setLoadingStudents(false)
    }
  }, [apiFetch, search])

  useEffect(() => {
    loadKpis()
  }, [loadKpis])

  useEffect(() => {
    if (tab === 'students') loadStudents()
  }, [tab, loadStudents])

  // ─── CSV export ────────────────────────────────────────
  function exportCsv() {
    const rows = [
      ['Nom', 'Prénom', 'Email', 'Téléphone', 'Numéro unique', 'Ville', 'Catégorie', 'Actif', 'Inscrit le'],
      ...students.map((s) => [
        s.nom, s.prenom, s.email, s.telephone, s.numeroUnique,
        s.ville, s.categoriePermis, s.actif ? 'Oui' : 'Non',
        new Date(s.createdAt).toLocaleDateString('fr-FR'),
      ]),
    ]
    const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `etudiants_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ─── Submit add-student form ───────────────────────────
  async function handleAddStudent(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setTempPassword(null)
    try {
      const res = await apiFetch('/api/auto-ecole/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Erreur lors de l\'inscription')
        return
      }
      setTempPassword(data.tempPassword || null)
      // Refresh lists
      loadKpis()
      loadStudents()
      // Reset form
      setForm({
        email: '', nom: '', prenom: '', dateNaissance: '', numeroIdentite: '',
        telephone: '', ville: 'Conakry', region: 'Conakry', categoriePermis: 'B',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur réseau')
    } finally {
      setSubmitting(false)
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord Auto-école</h1>
          <p className="text-gray-500 text-sm">Gérez vos étudiants et suivez leurs performances</p>
        </div>
        <Dialog open={addOpen} onOpenChange={(o) => { setAddOpen(o); if (!o) { setTempPassword(null); setError(null) } }}>
          <DialogTrigger asChild>
            <Button className="bg-[#009460] hover:bg-[#007a4d]">
              <UserPlus className="h-4 w-4 mr-2" />
              Inscrire un étudiant
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Inscrire un nouvel étudiant</DialogTitle>
              <DialogDescription>
                L'étudiant recevra un email de bienvenue avec son numéro unique. Un mot de passe temporaire sera généré.
              </DialogDescription>
            </DialogHeader>

            {tempPassword ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-2">
                  <p className="text-sm font-medium text-green-800">Étudiant inscrit avec succès !</p>
                  <p className="text-xs text-green-700">
                    Transmettez ce mot de passe temporaire à l'étudiant. Il devra le changer à la première connexion.
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-2 bg-white rounded font-mono text-sm border">
                      {tempPassword}
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        navigator.clipboard.writeText(tempPassword)
                        setCopied(true)
                        setTimeout(() => setCopied(false), 2000)
                      }}
                    >
                      {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <Button onClick={() => { setAddOpen(false); setTempPassword(null) }} className="w-full">
                  Terminer
                </Button>
              </div>
            ) : (
              <form onSubmit={handleAddStudent} className="space-y-3">
                {error && (
                  <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                    {error}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="nom">Nom</Label>
                    <Input id="nom" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="prenom">Prénom</Label>
                    <Input id="prenom" value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} required />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="dateNaissance">Date de naissance</Label>
                    <Input id="dateNaissance" type="date" value={form.dateNaissance} onChange={(e) => setForm({ ...form, dateNaissance: e.target.value })} required />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="numeroIdentite">N° d'identité</Label>
                    <Input id="numeroIdentite" value={form.numeroIdentite} onChange={(e) => setForm({ ...form, numeroIdentite: e.target.value })} required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="telephone">Téléphone</Label>
                    <Input id="telephone" placeholder="+224 6XX XX XX XX" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} required />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="categoriePermis">Catégorie</Label>
                    <select
                      id="categoriePermis"
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                      value={form.categoriePermis}
                      onChange={(e) => setForm({ ...form, categoriePermis: e.target.value })}
                    >
                      {['A', 'B', 'C', 'D', 'E', 'BE', 'CE', 'DE'].map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="ville">Ville</Label>
                    <Input id="ville" value={form.ville} onChange={(e) => setForm({ ...form, ville: e.target.value })} required />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="region">Région</Label>
                    <Input id="region" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} required />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Annuler</Button>
                  <Button type="submit" disabled={submitting} className="bg-[#009460] hover:bg-[#007a4d]">
                    {submitting ? 'Inscription...' : 'Inscrire'}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {[
          { id: 'overview' as const, label: 'Vue d\'ensemble', icon: TrendingUp },
          { id: 'students' as const, label: 'Étudiants', icon: Users },
          { id: 'analytics' as const, label: 'Statistiques', icon: GraduationCap },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
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
            <KpiCard label="Étudiants" value={kpi.totalStudents} icon={Users} color="bg-blue-500" />
            <KpiCard label="Étudiants actifs" value={kpi.activeStudents} icon={GraduationCap} color="bg-green-500" />
            <KpiCard label="Examens passés" value={kpi.totalExams} icon={TrendingUp} color="bg-purple-500" />
            <KpiCard label="Taux de réussite" value={`${kpi.successRate}%`} icon={Check} color="bg-orange-500" />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Examens à venir (7 jours)</CardTitle>
              <CardDescription>Étudiants ayant un examen programmé cette semaine</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#009460]">{kpi.upcomingExams}</div>
              <Calendar className="h-5 w-5 text-gray-400 mt-2" />
            </CardContent>
          </Card>

          <TwoFactorSettings />
        </div>
      )}

      {/* ─── Students tab ─── */}
      {tab === 'students' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher par nom, email, numéro unique..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={exportCsv} disabled={students.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={() => setAddOpen(true)} className="bg-[#009460] hover:bg-[#007a4d]">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
          </div>

          {loadingStudents ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : students.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                Aucun étudiant trouvé
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Étudiant</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Téléphone</TableHead>
                      <TableHead>N° unique</TableHead>
                      <TableHead>Cat.</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">
                          {s.prenom} {s.nom}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">{s.email}</TableCell>
                        <TableCell className="text-sm">{s.telephone}</TableCell>
                        <TableCell className="font-mono text-xs">{s.numeroUnique}</TableCell>
                        <TableCell><Badge variant="outline">{s.categoriePermis}</Badge></TableCell>
                        <TableCell>
                          {s.actif ? (
                            <Badge variant="default" className="bg-green-600">Actif</Badge>
                          ) : (
                            <Badge variant="secondary">Inactif</Badge>
                          )}
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

      {/* ─── Analytics tab ─── */}
      {tab === 'analytics' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Évolution mensuelle (6 derniers mois)</CardTitle>
              <CardDescription>Examens passés vs réussis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {monthlyData.map((m) => {
                  const total = Math.max(m.exams, MAX_CHART_VALUE)
                  const passedPct = m.exams > 0 ? (m.passed / m.exams) * 100 : 0
                  const examsPct = (m.exams / total) * 100
                  return (
                    <div key={m.month} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{m.month}</span>
                        <span className="text-gray-500">
                          {m.passed}/{m.exams} réussis
                          {m.exams > 0 && ` (${Math.round(passedPct)}%)`}
                        </span>
                      </div>
                      <div className="relative h-6 bg-gray-100 rounded">
                        <div
                          className="absolute h-full bg-purple-200 rounded"
                          style={{ width: `${examsPct}%` }}
                        />
                        <div
                          className="absolute h-full bg-green-500 rounded"
                          style={{ width: `${(m.passed / total) * 100}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
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
