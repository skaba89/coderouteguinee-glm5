'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/lib/auth-context';
import { ViewType, ExamSession } from '@/lib/types';
import { mockExamResults } from '@/lib/mock-data';
import {
  User,
  Calendar,
  Award,
  TrendingUp,
  BookOpen,
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight,
  FileText
} from 'lucide-react';

interface CandidateDashboardProps {
  onViewChange: (view: ViewType) => void;
}

export default function CandidateDashboard({ onViewChange }: CandidateDashboardProps) {
  const { user } = useAuth();

  const passedExams = mockExamResults.filter(r => r.reussi).length;
  const totalExams = mockExamResults.length;
  const successRate = totalExams > 0 ? Math.round((passedExams / totalExams) * 100) : 0;

  const stats = [
    {
      title: 'Examens passés',
      value: totalExams.toString(),
      icon: FileText,
      color: '#009460',
      bgColor: '#00946015'
    },
    {
      title: 'Taux de réussite',
      value: `${successRate}%`,
      icon: TrendingUp,
      color: '#FCD116',
      bgColor: '#FCD11615'
    },
    {
      title: 'Prochain examen',
      value: '15 mars 2026',
      icon: Calendar,
      color: '#CE1126',
      bgColor: '#CE112615'
    }
  ];

  const recentSessions: ExamSession[] = [
    {
      id: 'SES-003',
      candidatId: user?.id || '',
      centreId: 'CTR-001',
      centreNom: 'Centre RouteSafe Kaloum',
      date: '2026-03-15',
      heure: '09:00',
      statut: 'programme',
      totalQuestions: 40,
      dateInscription: '2026-03-01'
    },
    ...mockExamResults.map(r => r.session)
  ];

  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case 'reussi':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100"><CheckCircle className="w-3 h-3 mr-1" />Réussi</Badge>;
      case 'echoue':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100"><XCircle className="w-3 h-3 mr-1" />Échoué</Badge>;
      case 'programme':
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100"><Clock className="w-3 h-3 mr-1" />Programmé</Badge>;
      default:
        return <Badge>{statut}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Card */}
        <Card className="mb-8 border-0 shadow-lg overflow-hidden">
          <div className="h-2" style={{ background: 'linear-gradient(to right, #CE1126, #FCD116, #009460)' }}></div>
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold" style={{ backgroundColor: '#009460' }}>
                  {user?.prenom?.[0]}{user?.nom?.[0]}
                </div>
                <div>
                  <h1 className="text-2xl font-bold" style={{ color: '#1A2332' }}>
                    Bienvenue, {user?.prenom} {user?.nom}
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="font-mono text-xs" style={{ borderColor: '#009460', color: '#009460' }}>
                      {user?.numeroUnique}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Catégorie {user?.categoriePermis}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  className="text-white font-semibold"
                  style={{ backgroundColor: '#009460' }}
                  onClick={() => onViewChange('exam-booking')}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Réserver un examen
                </Button>
                <Button
                  variant="outline"
                  className="font-semibold"
                  style={{ borderColor: '#FCD116', color: '#1A2332' }}
                  onClick={() => onViewChange('practice-test')}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  S&apos;entraîner
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, index) => (
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

        {/* Progress Card */}
        <Card className="mb-8 border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: '#1A2332' }}>
              <Award className="w-5 h-5" style={{ color: '#FCD116' }} />
              Progression vers le permis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">Score requis: 35/40</span>
                  <span className="text-sm font-semibold" style={{ color: successRate >= 88 ? '#009460' : '#CE1126' }}>
                    Meilleur score: {mockExamResults.length > 0 ? `${mockExamResults[0].score}/${mockExamResults[0].totalQuestions}` : 'N/A'}
                  </span>
                </div>
                <Progress value={successRate} className="h-3" />
              </div>
              <p className="text-sm text-gray-500">
                {successRate >= 88
                  ? '🎉 Félicitations ! Vous avez atteint le score requis pour réussir l\'examen.'
                  : 'Continuez à vous entraîner pour atteindre le score minimum de 35/40.'
                }
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Results */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center justify-between" style={{ color: '#1A2332' }}>
                <span className="flex items-center gap-2">
                  <FileText className="w-5 h-5" style={{ color: '#009460' }} />
                  Résultats récents
                </span>
                <Button variant="ghost" size="sm" onClick={() => onViewChange('results')} style={{ color: '#009460' }}>
                  Voir tout <ChevronRight className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {recentSessions.map(session => (
                  <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div>
                      <p className="font-medium text-sm" style={{ color: '#1A2332' }}>{session.centreNom}</p>
                      <p className="text-xs text-gray-500">{new Date(session.date).toLocaleDateString('fr-FR')} à {session.heure}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {session.score !== undefined && (
                        <span className="text-sm font-semibold">{session.score}/{session.totalQuestions}</span>
                      )}
                      {getStatusBadge(session.statut)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Practice Test Quick Access */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ color: '#1A2332' }}>
                <BookOpen className="w-5 h-5" style={{ color: '#FCD116' }} />
                Test d&apos;entraînement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-500">
                  Préparez-vous en vous entraînant avec des questions similaires à l&apos;examen officiel.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-gray-50 rounded-lg text-center">
                    <p className="text-2xl font-bold" style={{ color: '#009460' }}>30</p>
                    <p className="text-xs text-gray-500">Questions disponibles</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg text-center">
                    <p className="text-2xl font-bold" style={{ color: '#FCD116' }}>5</p>
                    <p className="text-xs text-gray-500">Catégories</p>
                  </div>
                </div>
                <Button
                  className="w-full text-white font-semibold"
                  style={{ backgroundColor: '#009460' }}
                  onClick={() => onViewChange('practice-test')}
                >
                  <User className="w-4 h-4 mr-2" />
                  Commencer l&apos;entraînement
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
