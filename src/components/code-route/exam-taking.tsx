'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Question, ViewType, ExamResult, CategoryResult } from '@/lib/types';
import { getRandomQuestions } from '@/lib/mock-data';
import { useAuth } from '@/lib/auth-context';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Flag,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Shield
} from 'lucide-react';

interface ExamTakingProps {
  isPractice?: boolean;
  onViewChange: (view: ViewType) => void;
  onExamComplete: (result: ExamResult) => void;
}

export default function ExamTaking({ isPractice = false, onViewChange, onExamComplete }: ExamTakingProps) {
  const { user } = useAuth();
  const totalQuestions = isPractice ? 20 : 40;
  const timeMinutes = isPractice ? 15 : 30;
  const passingScore = isPractice ? 14 : 35;

  const [examQuestions, setExamQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [flagged, setFlagged] = useState<boolean[]>([]);
  const [timeLeft, setTimeLeft] = useState(timeMinutes * 60);
  const [showConfirm, setShowConfirm] = useState(false);
  const [examStarted, setExamStarted] = useState(false);
  const [examFinished, setExamFinished] = useState(false);
  const [result, setResult] = useState<ExamResult | null>(null);

  const autoSubmitRef = useRef(false);

  // Initialize exam
  useEffect(() => {
    const count = isPractice ? 20 : 40;
    const selected = getRandomQuestions(count);
    setExamQuestions(selected);
    setAnswers(new Array(count).fill(null));
    setFlagged(new Array(count).fill(false));
  }, [isPractice]);

  // Timer
  useEffect(() => {
    if (!examStarted || examFinished) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          autoSubmitRef.current = true;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [examStarted, examFinished]);

  // Auto-submit when time runs out
  useEffect(() => {
    if (autoSubmitRef.current && !examFinished) {
      autoSubmitRef.current = false;
      submitExam();
    }
  });

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleAnswer = (questionIndex: number, answerIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = answerIndex;
    setAnswers(newAnswers);
  };

  const toggleFlag = (questionIndex: number) => {
    const newFlagged = [...flagged];
    newFlagged[questionIndex] = !newFlagged[questionIndex];
    setFlagged(newFlagged);
  };

  const submitExam = () => {
    let correct = 0;
    const categoryMap: Record<string, { total: number; correct: number }> = {};

    examQuestions.forEach((q, i) => {
      if (!categoryMap[q.categorie]) {
        categoryMap[q.categorie] = { total: 0, correct: 0 };
      }
      categoryMap[q.categorie].total++;
      if (answers[i] === q.bonneReponse) {
        correct++;
        categoryMap[q.categorie].correct++;
      }
    });

    const details: CategoryResult[] = Object.entries(categoryMap).map(([categorie, data]) => ({
      categorie,
      total: data.total,
      correct: data.correct,
    }));

    const examResult: ExamResult = {
      id: `RES-${Date.now()}`,
      session: {
        id: `SES-${Date.now()}`,
        candidatId: user?.id || '',
        centreId: isPractice ? 'PRACTICE' : 'CTR-001',
        centreNom: isPractice ? 'Entraînement' : 'Centre RouteSafe Kaloum',
        date: new Date().toISOString().split('T')[0],
        heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        statut: correct >= passingScore ? 'reussi' : 'echoue',
        score: correct,
        totalQuestions,
        reponses: answers as number[],
        dateInscription: new Date().toISOString().split('T')[0]
      },
      score: correct,
      totalQuestions,
      reussi: correct >= passingScore,
      details,
      datePassage: new Date().toISOString().split('T')[0]
    };

    setResult(examResult);
    setExamFinished(true);
    onExamComplete(examResult);
  };

  const answeredCount = answers.filter(a => a !== null).length;
  const progressPercent = (answeredCount / totalQuestions) * 100;

  // Pre-exam screen
  if (!examStarted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <Card className="border-0 shadow-xl overflow-hidden">
            <div className="h-2" style={{ background: 'linear-gradient(to right, #CE1126, #FCD116, #009460)' }}></div>
            <CardContent className="p-8">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: '#1A233215' }}>
                  <Shield className="w-10 h-10" style={{ color: '#1A2332' }} />
                </div>
                <h1 className="text-2xl font-bold mb-2" style={{ color: '#1A2332' }}>
                  {isPractice ? "Test d'entraînement" : 'Examen du code de la route'}
                </h1>
                <p className="text-gray-500 mb-8">
                  {isPractice
                    ? 'Entraînez-vous avec des questions similaires à l\'examen officiel'
                    : 'Examen officiel du permis de conduire — République de Guinée'}
                </p>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="p-4 bg-gray-50 rounded-xl text-center">
                    <p className="text-2xl font-bold" style={{ color: '#009460' }}>{totalQuestions}</p>
                    <p className="text-sm text-gray-500">Questions</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl text-center">
                    <p className="text-2xl font-bold" style={{ color: '#FCD116' }}>{timeMinutes} min</p>
                    <p className="text-sm text-gray-500">Durée</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl text-center">
                    <p className="text-2xl font-bold" style={{ color: '#CE1126' }}>{passingScore}/{totalQuestions}</p>
                    <p className="text-sm text-gray-500">Score requis</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl text-center">
                    <p className="text-2xl font-bold" style={{ color: '#1A2332' }}>4</p>
                    <p className="text-sm text-gray-500">Choix par question</p>
                  </div>
                </div>

                {!isPractice && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-left">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                      <div>
                        <p className="font-semibold text-red-700 text-sm">Anti-fraude</p>
                        <p className="text-sm text-red-600 mt-1">
                          Cet examen est surveillé. Toute tentative de triche entraînera l&apos;annulation immédiate de l&apos;examen et une interdiction de 6 mois.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 justify-center">
                  <Button
                    className="text-white font-semibold px-8"
                    style={{ backgroundColor: '#009460' }}
                    onClick={() => setExamStarted(true)}
                  >
                    Commencer l&apos;examen
                  </Button>
                  <Button variant="outline" onClick={() => onViewChange(isPractice ? 'candidate-dashboard' : 'candidate-dashboard')}>
                    Annuler
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Results screen
  if (examFinished && result) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <Card className="border-0 shadow-xl overflow-hidden">
            <div className="h-2" style={{ background: 'linear-gradient(to right, #CE1126, #FCD116, #009460)' }}></div>
            <CardContent className="p-8 text-center">
              {result.reussi ? (
                <>
                  <div className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: '#00946015' }}>
                    <CheckCircle className="w-14 h-14" style={{ color: '#009460' }} />
                  </div>
                  <h2 className="text-3xl font-bold mb-2" style={{ color: '#009460' }}>Félicitations !</h2>
                  <p className="text-gray-500 text-lg mb-6">Vous avez réussi l&apos;examen du code de la route</p>
                </>
              ) : (
                <>
                  <div className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: '#CE112615' }}>
                    <XCircle className="w-14 h-14" style={{ color: '#CE1126' }} />
                  </div>
                  <h2 className="text-3xl font-bold mb-2" style={{ color: '#CE1126' }}>Non réussi</h2>
                  <p className="text-gray-500 text-lg mb-6">Vous n&apos;avez pas atteint le score requis cette fois-ci</p>
                </>
              )}

              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <div className="text-5xl font-bold mb-2" style={{ color: result.reussi ? '#009460' : '#CE1126' }}>
                  {result.score}/{result.totalQuestions}
                </div>
                <p className="text-gray-500">Score minimum requis : {passingScore}/{totalQuestions}</p>
                <Progress
                  value={(result.score / result.totalQuestions) * 100}
                  className="h-3 mt-4"
                />
              </div>

              <div className="text-left mb-6">
                <h3 className="font-semibold mb-3" style={{ color: '#1A2332' }}>Résultats par catégorie</h3>
                <div className="space-y-2">
                  {result.details.map((d, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">{d.categorie}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${d.correct >= d.total * 0.75 ? '' : ''}`} style={{ color: d.correct >= d.total * 0.75 ? '#009460' : '#CE1126' }}>
                          {d.correct}/{d.total}
                        </span>
                        <Progress value={(d.correct / d.total) * 100} className="w-20 h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 justify-center">
                <Button
                  className="text-white font-semibold"
                  style={{ backgroundColor: '#009460' }}
                  onClick={() => onViewChange('results')}
                >
                  Voir les détails
                </Button>
                <Button variant="outline" onClick={() => onViewChange('candidate-dashboard')}>
                  Retour au tableau de bord
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const q = examQuestions[currentQuestion];

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#1A2332' }}>
      {/* Top Bar */}
      <div className="bg-white shadow-md px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="font-mono text-xs" style={{ borderColor: '#009460', color: '#009460' }}>
              {isPractice ? 'ENTRAÎNEMENT' : 'EXAMEN OFFICIEL'}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {user?.numeroUnique}
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Progress value={progressPercent} className="w-24 h-2" />
              <span className="text-xs text-gray-500">{answeredCount}/{totalQuestions}</span>
            </div>
            <div className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-mono font-bold ${
              timeLeft <= 300 ? 'bg-red-100 text-red-700' : timeLeft <= 600 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100'
            }`}>
              <Clock className="w-4 h-4" />
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>
      </div>

      {/* Question Area */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex items-start justify-center pt-6 pb-4 px-4">
          <div className="w-full max-w-3xl">
            {/* Question Header */}
            <div className="flex items-center justify-between mb-4">
              <Badge className="text-white" style={{ backgroundColor: '#009460' }}>
                Question {currentQuestion + 1}/{totalQuestions}
              </Badge>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">{q?.categorie}</Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className={flagged[currentQuestion] ? 'text-yellow-500' : 'text-gray-400'}
                  onClick={() => toggleFlag(currentQuestion)}
                >
                  <Flag className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Question Text */}
            <Card className="border-0 shadow-lg mb-6">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold" style={{ color: '#1A2332' }}>
                  {q?.texte}
                </h2>
              </CardContent>
            </Card>

            {/* Options */}
            <div className="grid gap-3">
              {q?.options.map((option, optIndex) => (
                <button
                  key={optIndex}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    answers[currentQuestion] === optIndex
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                  onClick={() => handleAnswer(currentQuestion, optIndex)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      answers[currentQuestion] === optIndex
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {String.fromCharCode(65 + optIndex)}
                    </div>
                    <span className={`font-medium ${answers[currentQuestion] === optIndex ? 'text-green-700' : ''}`} style={answers[currentQuestion] !== optIndex ? { color: '#1A2332' } : {}}>
                      {option}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Question Navigator */}
        <div className="bg-white border-t px-4 py-3">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {Array.from({ length: totalQuestions }, (_, i) => (
                <button
                  key={i}
                  className={`w-8 h-8 rounded-md text-xs font-medium flex-shrink-0 transition-all ${
                    i === currentQuestion
                      ? 'ring-2 ring-green-500 text-white'
                      : flagged[i]
                      ? 'bg-yellow-100 text-yellow-700'
                      : answers[i] !== null
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                  style={i === currentQuestion ? { backgroundColor: '#009460' } : {}}
                  onClick={() => setCurrentQuestion(i)}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="bg-white border-t px-4 py-4">
          <div className="max-w-3xl mx-auto flex justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
              disabled={currentQuestion === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Précédent
            </Button>
            <Button
              className="text-white font-semibold"
              style={{ backgroundColor: '#CE1126' }}
              onClick={() => setShowConfirm(true)}
            >
              Terminer l&apos;examen
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentQuestion(Math.min(totalQuestions - 1, currentQuestion + 1))}
              disabled={currentQuestion === totalQuestions - 1}
            >
              Suivant
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* Submit Confirmation */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Terminer l&apos;examen ?</AlertDialogTitle>
            <AlertDialogDescription>
              Vous avez répondu à {answeredCount} questions sur {totalQuestions}.
              {answeredCount < totalQuestions && ` ${totalQuestions - answeredCount} questions sans réponse.`}
              {flagged.filter(f => f).length > 0 && ` ${flagged.filter(f => f).length} question(s) marquée(s) d'un drapeau.`}
              <br /><br />
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuer l&apos;examen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { setShowConfirm(false); submitExam(); }}
              className="text-white"
              style={{ backgroundColor: '#CE1126' }}
            >
              Confirmer et soumettre
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
