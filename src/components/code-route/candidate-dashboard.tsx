'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/lib/auth-context';
import { TwoFactorSettings } from './two-factor-settings';
import { ViewType, ExamSession, NationalLanguage } from '@/lib/types';
import { questions } from '@/lib/mock-data';
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
  FileText,
  Globe,
  Volume2,
  Eye,
  Image as ImageIcon,
  GraduationCap,
  Loader2,
} from 'lucide-react';

interface CandidateDashboardProps {
  onViewChange: (view: ViewType) => void;
}

interface CandidateStats {
  totalExams: number;
  passedExams: number;
  failedExams: number;
  successRate: number;
  bestScore: string | null;
  upcomingExam: { date: string; heure: string; centreNom: string } | null;
}

export default function CandidateDashboard({ onViewChange }: CandidateDashboardProps) {
  const { user } = useAuth();
  const [examSessions, setExamSessions] = useState<ExamSession[]>([]);
  const [stats, setStats] = useState<CandidateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<{ id: string; centreNom: string; date: string; heure: string; statutPaiement: string; confirmee: boolean; numeroConvocation?: string }[]>([]);

  const signQuestions = questions.filter(q => q.mediaType === 'sign' || q.mediaType === 'sign+scenario').length;
  const scenarioQuestions = questions.filter(q => q.mediaType === 'scenario' || q.mediaType === 'sign+scenario').length;

  // Fetch candidate data from API
  const fetchCandidateData = useCallback(async () => {
    try {
      const res = await fetch('/api/exams/candidate');
      if (res.ok) {
        const data = await res.json();
        setExamSessions(data.examSessions.map((s: Record<string, unknown>) => ({
          id: s.id as string,
          candidatId: s.candidatId as string,
          centreId: s.centreId as string,
          centreNom: s.centreNom as string,
          date: s.date as string,
          heure: s.heure as string,
          langue: (s.langue as NationalLanguage) || 'fr',
          statut: s.statut as ExamSession['statut'],
          score: s.score as number | undefined,
          totalQuestions: s.totalQuestions as number,
          dateInscription: s.dateInscription as string,
        })));
        setStats(data.stats);
        setBookings((data.bookings || []).map((b: Record<string, unknown>) => ({
          id: b.id as string,
          centreNom: b.centreNom as string,
          date: b.date as string,
          heure: b.heure as string,
          statutPaiement: b.statutPaiement as string,
          confirmee: b.confirmee as boolean,
          numeroConvocation: b.numeroConvocation as string | undefined,
        })));
      }
    } catch (error) {
      console.error('Failed to fetch candidate data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCandidateData();
  }, [fetchCandidateData]);

  const totalExams = stats?.totalExams || 0;
  const successRate = stats?.successRate || 0;
  const upcomingExam = stats?.upcomingExam;

  const dashboardStats = [
    { title: 'Examens passés', value: totalExams.toString(), icon: FileText, color: '#009460', bgColor: '#00946015' },
    { title: 'Taux de réussite', value: `${successRate}%`, icon: TrendingUp, color: '#FCD116', bgColor: '#FCD11615' },
    { title: 'Prochain examen', value: upcomingExam ? new Date(upcomingExam.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : 'Aucun', icon: Calendar, color: '#CE1126', bgColor: '#CE112615' },
    { title: 'Langue', value: 'Français', icon: Globe, color: '#7C3AED', bgColor: '#7C3AED15' },
  ];

  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case 'reussi':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100"><CheckCircle className="w-3 h-3 mr-1" />Réussi</Badge>;
      case 'echoue':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100"><XCircle className="w-3 h-3 mr-1" />Échoué</Badge>;
      case 'programme':
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100"><Clock className="w-3 h-3 mr-1" />Programmé</Badge>;
      case 'en_cours':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100"><Clock className="w-3 h-3 mr-1" />En cours</Badge>;
      default:
        return <Badge>{statut}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#009460' }} />
          <span className="text-gray-500">Chargement de vos données...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Card */}
        <Card className="mb-8 border-0 shadow-lg overflow-hidden">
          <div className="h-1.5 flex">
            <div className="flex-1" style={{ backgroundColor: '#CE1126' }}></div>
            <div className="flex-1" style={{ backgroundColor: '#FCD116' }}></div>
            <div className="flex-1" style={{ backgroundColor: '#009460' }}></div>
          </div>
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
                    <Badge variant="outline" className="text-xs flex items-center gap-1" style={{ borderColor: '#FCD116', color: '#1A2332' }}>
                      <Globe className="w-3 h-3" />
                      Français
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 flex-wrap">
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
                <Button
                  variant="outline"
                  className="font-semibold"
                  style={{ borderColor: '#7C3AED', color: '#7C3AED' }}
                  onClick={() => onViewChange('courses')}
                >
                  <GraduationCap className="w-4 h-4 mr-2" />
                  Cours
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {dashboardStats.map((stat, index) => (
            <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500 mb-1">{stat.title}</p>
                    <p className="text-xl sm:text-3xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
                  </div>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: stat.bgColor }}>
                    <stat.icon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: stat.color }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Confirmed Bookings with PDF Download */}
        {bookings.filter(b => b.confirmee || b.statutPaiement === 'confirme').length > 0 && (
          <Card className="mb-8 border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ color: '#1A2332' }}>
                <Calendar className="w-5 h-5" style={{ color: '#009460' }} />
                Vos convocations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {bookings.filter(b => b.confirmee || b.statutPaiement === 'confirme').map(booking => (
                  <div key={booking.id} className="flex items-center justify-between p-4 bg-green-50/50 rounded-lg border border-green-100">
                    <div>
                      <p className="font-medium text-sm" style={{ color: '#1A2332' }}>{booking.centreNom}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(booking.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} a {booking.heure}
                      </p>
                      {booking.numeroConvocation && (
                        <p className="text-[10px] font-mono text-gray-400 mt-0.5">Ref: {booking.numeroConvocation}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs">
                        <CheckCircle className="w-3 h-3 mr-1" />Confirme
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs gap-1"
                        style={{ borderColor: '#009460', color: '#009460' }}
                        onClick={() => window.open(`/api/convocation/${booking.id}`, '_blank')}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Telecharger PDF
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Multimedia Features Banner */}
        <Card className="mb-8 border-0 shadow-md overflow-hidden">
          <CardContent className="p-0">
            <div className="flex flex-col sm:flex-row">
              <div className="flex-1 p-6" style={{ background: 'linear-gradient(135deg, #1A2332 0%, #2d3e54 100%)' }}>
                <h3 className="text-white font-bold text-lg mb-2">Nouvelles fonctionnalités</h3>
                <p className="text-gray-300 text-sm mb-4">Passez votre examen avec des outils modernes</p>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-blue-500/20 text-blue-200 border border-blue-400/30">
                    <ImageIcon className="w-3 h-3 mr-1" /> {signQuestions} panneaux routiers
                  </Badge>
                  <Badge className="bg-purple-500/20 text-purple-200 border border-purple-400/30">
                    <Eye className="w-3 h-3 mr-1" /> {scenarioQuestions} scénarios visuels
                  </Badge>
                  <Badge className="bg-orange-500/20 text-orange-200 border border-orange-400/30">
                    <Volume2 className="w-3 h-3 mr-1" /> Français
                  </Badge>
                </div>
              </div>
              <div className="sm:w-64 p-6 flex flex-col justify-center items-center bg-gray-50">
                <Button
                  className="w-full text-white font-semibold mb-2"
                  style={{ backgroundColor: '#009460' }}
                  onClick={() => onViewChange('courses')}
                >
                  <GraduationCap className="w-4 h-4 mr-2" />
                  Accéder aux cours
                </Button>
                <Button
                  variant="outline"
                  className="w-full font-semibold text-sm"
                  disabled
                >
                  <Globe className="w-4 h-4 mr-2" />
                  Langues locales (bientôt)
                </Button>
              </div>
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
                {examSessions.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => onViewChange('results')} style={{ color: '#009460' }}>
                    Voir tout <ChevronRight className="w-4 h-4" />
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {examSessions.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500 font-medium">Aucun examen passé</p>
                  <p className="text-sm text-gray-400 mt-1">Réservez votre premier examen pour commencer</p>
                  <Button
                    className="mt-4 text-white font-semibold"
                    style={{ backgroundColor: '#009460' }}
                    onClick={() => onViewChange('exam-booking')}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Réserver un examen
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {examSessions.map(session => (
                    <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div>
                        <p className="font-medium text-sm" style={{ color: '#1A2332' }}>{session.centreNom}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-gray-500">{new Date(session.date).toLocaleDateString('fr-FR')} à {session.heure}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {session.score !== undefined && session.score !== null && (
                          <span className="text-sm font-semibold">{session.score}/{session.totalQuestions}</span>
                        )}
                        {getStatusBadge(session.statut)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Access */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ color: '#1A2332' }}>
                <Award className="w-5 h-5" style={{ color: '#FCD116' }} />
                Accès rapide
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <button
                  className="w-full p-4 rounded-xl border-2 border-gray-100 hover:border-green-200 bg-white hover:bg-green-50/50 transition-all text-left flex items-center gap-4"
                  onClick={() => onViewChange('courses')}
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#00946015' }}>
                    <GraduationCap className="w-6 h-6" style={{ color: '#009460' }} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold" style={{ color: '#1A2332' }}>Cours et formation</p>
                    <p className="text-sm text-gray-500">Cours avec panneaux et audio en français</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300" />
                </button>

                <button
                  className="w-full p-4 rounded-xl border-2 border-gray-100 hover:border-blue-200 bg-white hover:bg-blue-50/50 transition-all text-left flex items-center gap-4"
                  onClick={() => onViewChange('practice-test')}
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#0EA5E915' }}>
                    <BookOpen className="w-6 h-6" style={{ color: '#0EA5E9' }} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold" style={{ color: '#1A2332' }}>Test d&apos;entraînement</p>
                    <p className="text-sm text-gray-500">{questions.length} questions avec images et audio</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300" />
                </button>

                <button
                  className="w-full p-4 rounded-xl border-2 border-gray-100 bg-gray-50 text-left flex items-center gap-4 opacity-60 cursor-not-allowed"
                  disabled
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#F9731615' }}>
                    <Volume2 className="w-6 h-6" style={{ color: '#F97316' }} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold" style={{ color: '#1A2332' }}>Langues locales</p>
                    <p className="text-sm text-gray-500">Langues nationales bientôt disponibles</p>
                  </div>
                  <Badge variant="outline" className="text-xs" style={{ borderColor: '#FCD116', color: '#1A2332' }}>
                    Français
                  </Badge>
                </button>
              </div>

              {/* Progress */}
              <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">Score requis: 35/40</span>
                  <span className="text-sm font-semibold" style={{ color: successRate >= 88 ? '#009460' : '#CE1126' }}>
                    Meilleur score: {stats?.bestScore || 'N/A'}
                  </span>
                </div>
                <Progress value={successRate} className="h-3" />
                <p className="text-sm text-gray-500 mt-2">
                  {successRate >= 88
                    ? 'Félicitations ! Vous avez atteint le score requis pour réussir l\'examen.'
                    : 'Continuez à vous entraîner pour atteindre le score minimum de 35/40.'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 2FA Settings — protect candidate account */}
        <TwoFactorSettings />
      </div>
    </div>
  );
}
