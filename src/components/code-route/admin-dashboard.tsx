'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth-context';
import { centres } from '@/lib/mock-data';
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
  BarChart3
} from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();

  const nationalStats = [
    { title: 'Candidats inscrits', value: '52 347', icon: Users, color: '#009460', bgColor: '#00946015' },
    { title: 'Centres agréés', value: '15', icon: Building2, color: '#FCD116', bgColor: '#FCD11615' },
    { title: 'Examens passés', value: '38 912', icon: FileCheck, color: '#CE1126', bgColor: '#CE112615' },
    { title: 'Taux de réussite', value: '67%', icon: TrendingUp, color: '#1A2332', bgColor: '#1A233215' },
  ];

  const recentCandidates = [
    { nom: 'Diallo Mamadou', id: 'GN-CODE-2026-123456', centre: 'Centre RouteSafe Kaloum', date: '13/03/2026', score: '38/40', statut: 'reussi' },
    { nom: 'Touré Aissatou', id: 'GN-CODE-2026-234567', centre: 'Centre Auto-Plus Dixinn', date: '13/03/2026', score: '32/40', statut: 'echoue' },
    { nom: 'Camara Ibrahim', id: 'GN-CODE-2026-345678', centre: 'Centre Conduite Matam', date: '12/03/2026', score: '36/40', statut: 'reussi' },
    { nom: 'Bangoura Fatoumata', id: 'GN-CODE-2026-456789', centre: 'Centre Permis Kankan', date: '12/03/2026', score: '40/40', statut: 'reussi' },
    { nom: 'Sylla Mohamed', id: 'GN-CODE-2026-567890', centre: 'Centre RouteSafe Kaloum', date: '11/03/2026', score: '28/40', statut: 'echoue' },
  ];

  const fraudAlerts = [
    { type: 'Identité suspecte', desc: 'Candidat GN-CODE-2026-789012 — Photo non conforme', severity: 'high', time: 'Il y a 2h' },
    { type: 'Comportement anormal', desc: 'Temps de réponse inhabituellement rapide au centre de Dixinn', severity: 'medium', time: 'Il y a 5h' },
    { type: 'Double inscription', desc: 'Même numéro d\'identité détecté dans 2 centres', severity: 'high', time: 'Il y a 1j' },
  ];

  const monthlyData = [
    { month: 'Jan', exams: 3200, passed: 2100 },
    { month: 'Fév', exams: 2800, passed: 1900 },
    { month: 'Mar', exams: 3500, passed: 2400 },
    { month: 'Avr', exams: 3100, passed: 2050 },
    { month: 'Mai', exams: 3900, passed: 2650 },
    { month: 'Jun', exams: 4200, passed: 2900 },
  ];

  const maxExams = Math.max(...monthlyData.map(d => d.exams));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#1A2332' }}>
              Administration nationale
            </h1>
            <p className="text-gray-500">Tableau de bord — République de Guinée</p>
          </div>
          <Badge className="px-4 py-2 text-sm" style={{ backgroundColor: '#1A2332', color: 'white' }}>
            <Shield className="w-4 h-4 mr-2" />
            {user?.role === 'administration' ? 'Administrateur' : 'Agent'}
          </Badge>
        </div>

        {/* National Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {nationalStats.map((stat, index) => (
            <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">{stat.title}</p>
                    <p className="text-3xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: stat.bgColor }}>
                    <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Monthly Chart */}
          <Card className="border-0 shadow-md lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ color: '#1A2332' }}>
                <BarChart3 className="w-5 h-5" style={{ color: '#009460' }} />
                Examens mensuels
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {monthlyData.map((d, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <span className="w-8 text-sm text-gray-500 font-medium">{d.month}</span>
                    <div className="flex-1 flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-4 rounded-full"
                          style={{ width: `${(d.exams / maxExams) * 100}%`, backgroundColor: '#00946030' }}
                        ></div>
                        <span className="text-xs text-gray-500">{d.exams}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-4 rounded-full"
                          style={{ width: `${(d.passed / maxExams) * 100}%`, backgroundColor: '#009460' }}
                        ></div>
                        <span className="text-xs font-medium" style={{ color: '#009460' }}>{d.passed}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#00946030' }}></div>
                  <span className="text-xs text-gray-500">Total examens</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#009460' }}></div>
                  <span className="text-xs text-gray-500">Réussis</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fraud Alerts */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ color: '#1A2332' }}>
                <AlertTriangle className="w-5 h-5" style={{ color: '#CE1126' }} />
                Alertes anti-fraude
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {fraudAlerts.map((alert, i) => (
                  <div key={i} className={`p-3 rounded-lg border-l-4 ${
                    alert.severity === 'high' ? 'bg-red-50 border-red-500' : 'bg-yellow-50 border-yellow-500'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold" style={{ color: '#1A2332' }}>{alert.type}</p>
                        <p className="text-xs text-gray-500 mt-1">{alert.desc}</p>
                      </div>
                      <span className="text-xs text-gray-400 whitespace-nowrap">{alert.time}</span>
                    </div>
                    <div className="mt-2">
                      <Badge variant="outline" className={`text-xs ${
                        alert.severity === 'high' ? 'border-red-300 text-red-600' : 'border-yellow-300 text-yellow-600'
                      }`}>
                        {alert.severity === 'high' ? 'Critique' : 'Moyen'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4 text-sm" style={{ color: '#CE1126', borderColor: '#CE1126' }}>
                Voir toutes les alertes
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Center Management */}
        <Card className="border-0 shadow-md mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: '#1A2332' }}>
              <Building2 className="w-5 h-5" style={{ color: '#FCD116' }} />
              Gestion des centres agréés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Centre</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Région</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Capacité</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Contact</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Statut</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {centres.map((centre) => (
                    <tr key={centre.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium" style={{ color: '#1A2332' }}>{centre.nom}</p>
                          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" />{centre.adresse}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4">{centre.region}</td>
                      <td className="py-3 px-4">{centre.capacite} places</td>
                      <td className="py-3 px-4">
                        <p className="text-xs flex items-center gap-1">
                          <Phone className="w-3 h-3" />{centre.telephone}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        {centre.actif ? (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                            <CheckCircle className="w-3 h-3 mr-1" />Actif
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                            <XCircle className="w-3 h-3 mr-1" />Inactif
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Recent Candidates */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: '#1A2332' }}>
              <Users className="w-5 h-5" style={{ color: '#009460' }} />
              Candidats récents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Candidat</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">N° unique</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Centre</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Score</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Résultat</th>
                  </tr>
                </thead>
                <tbody>
                  {recentCandidates.map((c, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium" style={{ color: '#1A2332' }}>{c.nom}</td>
                      <td className="py-3 px-4 font-mono text-xs">{c.id}</td>
                      <td className="py-3 px-4">{c.centre}</td>
                      <td className="py-3 px-4">{c.date}</td>
                      <td className="py-3 px-4 font-semibold">{c.score}</td>
                      <td className="py-3 px-4">
                        {c.statut === 'reussi' ? (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                            <CheckCircle className="w-3 h-3 mr-1" />Réussi
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                            <XCircle className="w-3 h-3 mr-1" />Échoué
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
