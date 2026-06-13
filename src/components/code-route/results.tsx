'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ExamResult, ViewType } from '@/lib/types';
import { mockExamResults } from '@/lib/mock-data';
import { useAuth } from '@/lib/auth-context';
import {
  CheckCircle,
  XCircle,
  Download,
  Printer,
  FileText,
  Award,
  Calendar,
  Building2,
  Clock,
  BarChart3
} from 'lucide-react';

interface ResultsProps {
  latestResult?: ExamResult | null;
  onViewChange: (view: ViewType) => void;
}

export default function Results({ latestResult, onViewChange }: ResultsProps) {
  const { user } = useAuth();
  const allResults = latestResult ? [latestResult, ...mockExamResults] : mockExamResults;

  const displayResult = allResults[0];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-6" style={{ color: '#1A2332' }}>
          Résultats & Certificat
        </h1>

        {displayResult && (
          <>
            {/* Main Result Card */}
            <Card className="border-0 shadow-xl mb-8 overflow-hidden">
              <div className="h-2" style={{ background: 'linear-gradient(to right, #CE1126, #FCD116, #009460)' }}></div>
              <CardContent className="p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
                  {displayResult.reussi ? (
                    <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{ backgroundColor: '#00946015' }}>
                      <CheckCircle className="w-14 h-14" style={{ color: '#009460' }} />
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{ backgroundColor: '#CE112615' }}>
                      <XCircle className="w-14 h-14" style={{ color: '#CE1126' }} />
                    </div>
                  )}
                  <div className="text-center sm:text-left">
                    <h2 className={`text-3xl font-bold ${displayResult.reussi ? '' : ''}`} style={{ color: displayResult.reussi ? '#009460' : '#CE1126' }}>
                      {displayResult.reussi ? 'EXAMEN RÉUSSI' : 'EXAMEN NON RÉUSSI'}
                    </h2>
                    <p className="text-gray-500 mt-1">
                      Score : <span className="font-bold text-xl" style={{ color: displayResult.reussi ? '#009460' : '#CE1126' }}>{displayResult.score}/{displayResult.totalQuestions}</span>
                      {' '}— Minimum requis : 35/40
                    </p>
                  </div>
                  <div className="sm:ml-auto">
                    <Progress value={(displayResult.score / displayResult.totalQuestions) * 100} className="w-32 h-4" />
                    <p className="text-sm text-gray-500 text-center mt-1">{Math.round((displayResult.score / displayResult.totalQuestions) * 100)}%</p>
                  </div>
                </div>

                {/* Session Details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Building2 className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Centre</p>
                      <p className="text-sm font-medium" style={{ color: '#1A2332' }}>{displayResult.session.centreNom}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Date</p>
                      <p className="text-sm font-medium" style={{ color: '#1A2332' }}>{new Date(displayResult.datePassage).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Heure</p>
                      <p className="text-sm font-medium" style={{ color: '#1A2332' }}>{displayResult.session.heure}</p>
                    </div>
                  </div>
                </div>

                {/* Category Breakdown */}
                <div className="mb-8">
                  <h3 className="font-semibold flex items-center gap-2 mb-4" style={{ color: '#1A2332' }}>
                    <BarChart3 className="w-5 h-5" style={{ color: '#FCD116' }} />
                    Résultats par catégorie
                  </h3>
                  <div className="space-y-3">
                    {displayResult.details.map((d, i) => {
                      const percent = Math.round((d.correct / d.total) * 100);
                      const passed = percent >= 75;
                      return (
                        <div key={i} className="flex items-center gap-4">
                          <span className="w-32 text-sm font-medium text-gray-700">{d.categorie}</span>
                          <Progress value={percent} className="flex-1 h-3" />
                          <span className="text-sm font-bold w-16 text-right" style={{ color: passed ? '#009460' : '#CE1126' }}>
                            {d.correct}/{d.total}
                          </span>
                          <span className="text-xs w-10 text-right" style={{ color: passed ? '#009460' : '#CE1126' }}>
                            {percent}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Certificate (if passed) */}
                {displayResult.reussi && (
                  <Card className="border-2 border-dashed mb-6" style={{ borderColor: '#009460' }}>
                    <CardContent className="p-6 text-center">
                      <Award className="w-12 h-12 mx-auto mb-4" style={{ color: '#FCD116' }} />
                      <h3 className="text-xl font-bold mb-1" style={{ color: '#1A2332' }}>Certificat de réussite</h3>
                      <p className="text-gray-500 text-sm mb-4">Attestation de réussite à l&apos;examen théorique du code de la route</p>

                      <div className="bg-gray-50 rounded-xl p-6 mb-4 text-left max-w-md mx-auto">
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Candidat</span>
                            <span className="font-medium">{user?.prenom} {user?.nom}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">N° unique</span>
                            <span className="font-mono font-medium">{user?.numeroUnique}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Catégorie</span>
                            <span className="font-medium">Permis {user?.categoriePermis}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Score</span>
                            <span className="font-bold" style={{ color: '#009460' }}>{displayResult.score}/{displayResult.totalQuestions}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Référence</span>
                            <span className="font-mono">{displayResult.id}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Date</span>
                            <span className="font-medium">{new Date(displayResult.datePassage).toLocaleDateString('fr-FR')}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3 justify-center">
                        <Button
                          className="text-white font-semibold"
                          style={{ backgroundColor: '#009460' }}
                          onClick={() => window.print()}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Télécharger
                        </Button>
                        <Button variant="outline" onClick={() => window.print()}>
                          <Printer className="w-4 h-4 mr-2" />
                          Imprimer
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Actions */}
                <div className="flex gap-3 justify-center">
                  {!displayResult.reussi && (
                    <Button
                      className="text-white font-semibold"
                      style={{ backgroundColor: '#009460' }}
                      onClick={() => onViewChange('exam-booking')}
                    >
                      Reprendre l&apos;examen
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="font-semibold"
                    onClick={() => onViewChange('candidate-dashboard')}
                  >
                    Retour au tableau de bord
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Exam History */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: '#1A2332' }}>
              <FileText className="w-5 h-5" style={{ color: '#009460' }} />
              Historique des examens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Centre</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Score</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Résultat</th>
                  </tr>
                </thead>
                <tbody>
                  {allResults.map((r, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-3 px-4">{new Date(r.datePassage).toLocaleDateString('fr-FR')}</td>
                      <td className="py-3 px-4">{r.session.centreNom}</td>
                      <td className="py-3 px-4 font-semibold" style={{ color: r.reussi ? '#009460' : '#CE1126' }}>
                        {r.score}/{r.totalQuestions}
                      </td>
                      <td className="py-3 px-4">
                        {r.reussi ? (
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
