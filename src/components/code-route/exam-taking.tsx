'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { Question, ViewType, ExamResult, CategoryResult, NationalLanguage } from '@/lib/types';
import { getRandomQuestions } from '@/lib/mock-data';
import { useAuth } from '@/lib/auth-context';
import { RoadSignDisplay } from '@/components/code-route/road-signs';
import TTSPlayer from '@/components/code-route/tts-player';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Flag,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Shield,
  Volume2,
  Image as ImageIcon,
  Play,
  Eye,
  Globe,
  Maximize2,
  Pause,
  X,
  Video,
  Film,
} from 'lucide-react';

interface ExamTakingProps {
  isPractice?: boolean;
  onViewChange: (view: ViewType) => void;
  onExamComplete: (result: ExamResult) => void;
  preselectedLanguage?: NationalLanguage;
}

// ─── Mock Video Player Component ──────────────────────────────
function MockVideoPlayer({
  thumbnailUrl,
  title,
}: {
  thumbnailUrl?: string;
  title?: string;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          setIsPlaying(false);
          return 100;
        }
        return prev + 0.5;
      });
    }, 100);
    return () => clearInterval(timer);
  }, [isPlaying]);

  return (
    <div className="relative rounded-xl overflow-hidden border-2 border-white/10 shadow-lg bg-gray-900">
      {/* Player area */}
      <div className="relative aspect-video max-h-56 flex items-center justify-center">
        {/* Scenario thumbnail or placeholder */}
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={title || 'Scenario video'}
            className={`w-full h-full object-cover transition-opacity ${isPlaying ? 'opacity-60' : 'opacity-80'}`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1A2332 0%, #2A3A52 100%)' }}>
            <Film className="w-16 h-16 text-white/20" />
          </div>
        )}

        {/* Play button overlay */}
        {!isPlaying && (
          <button
            className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors cursor-pointer"
            onClick={() => setIsPlaying(true)}
          >
            <div className="w-16 h-16 rounded-full flex items-center justify-center bg-white/20 backdrop-blur-sm border-2 border-white/40 hover:bg-white/30 hover:scale-110 transition-all">
              <Play className="w-8 h-8 text-white ml-1" />
            </div>
          </button>
        )}

        {/* Pause overlay when playing */}
        {isPlaying && (
          <button
            className="absolute inset-0 flex items-center justify-center cursor-pointer"
            onClick={() => setIsPlaying(false)}
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-black/40 backdrop-blur-sm opacity-0 hover:opacity-100 transition-opacity">
              <Pause className="w-6 h-6 text-white" />
            </div>
          </button>
        )}

        {/* Video label */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <Badge className="text-[10px] px-2 py-0.5 bg-red-600 text-white border-0">
            <Video className="w-3 h-3 mr-1" />
            VIDEO
          </Badge>
        </div>

        {/* Time indicator */}
        {isPlaying && (
          <div className="absolute top-3 right-3 bg-black/60 rounded-md px-2 py-0.5 text-white text-xs font-mono">
            {Math.floor(progress * 0.3).toString().padStart(1, '0')}:{(Math.floor((progress * 0.3) % 1 * 60)).toString().padStart(2, '0')} / 0:30
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-700">
        <div
          className="h-full transition-all duration-100"
          style={{
            width: `${progress}%`,
            backgroundColor: progress >= 100 ? '#009460' : '#CE1126',
          }}
        />
      </div>

      {/* Controls bar */}
      <div className="flex items-center gap-3 px-4 py-2 bg-gray-800">
        <button
          className="text-white hover:text-green-400 transition-colors"
          onClick={() => {
            if (isPlaying) setIsPlaying(false);
            else {
              setProgress(0);
              setIsPlaying(true);
            }
          }}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>
        <div className="flex-1">
          <div className="text-xs text-gray-400">{title || 'Scénario vidéo'}</div>
        </div>
        <span className="text-xs text-gray-500 font-mono">
          {Math.floor(progress * 0.3)}s
        </span>
      </div>
    </div>
  );
}

export default function ExamTaking({ isPractice = false, onViewChange, onExamComplete, preselectedLanguage }: ExamTakingProps) {
  const { user } = useAuth();
  const totalQuestions = isPractice ? 20 : 40;
  const timeMinutes = isPractice ? 15 : 30;
  const passingScore = isPractice ? 14 : 35;

  // Language always French for now — local languages temporarily disabled
  const examLanguage: NationalLanguage = 'fr';
  const [examQuestions, setExamQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [flagged, setFlagged] = useState<boolean[]>([]);
  const [timeLeft, setTimeLeft] = useState(timeMinutes * 60);
  const [showConfirm, setShowConfirm] = useState(false);
  const [examStarted, setExamStarted] = useState(false);
  const [examFinished, setExamFinished] = useState(false);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const [showScenarioModal, setShowScenarioModal] = useState(false);

  const autoSubmitRef = useRef(false);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

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

  // Auto-submit
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

  // Text-to-Speech
  const speakText = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    utterance.rate = 0.9;
    utterance.pitch = 1;

    const voices = window.speechSynthesis.getVoices();
    const frenchVoice = voices.find(v => v.lang.startsWith('fr'));
    if (frenchVoice) utterance.voice = frenchVoice;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    speechRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  }, [isSpeaking]);

  const speakCurrentQuestion = useCallback(() => {
    const q = examQuestions[currentQuestion];
    if (!q) return;
    const fullText = `${q.texte}. ${q.options.map((o, i) => `Option ${String.fromCharCode(65 + i)}: ${o}`).join('. ')}`;
    speakText(fullText);
  }, [examQuestions, currentQuestion, speakText]);

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const submitExam = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);

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
        langue: examLanguage,
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

  // Pre-exam screen with language selection
  if (!examStarted) {
    return (
      <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #1A2332 0%, #0d1a2d 100%)' }}>
        {/* Guinea stripe */}
        <div className="flex h-1.5">
          <div className="flex-1" style={{ backgroundColor: '#CE1126' }}></div>
          <div className="flex-1" style={{ backgroundColor: '#FCD116' }}></div>
          <div className="flex-1" style={{ backgroundColor: '#009460' }}></div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-12">
          <Card className="border-0 shadow-2xl overflow-hidden">
            <div className="h-1.5 flex">
              <div className="flex-1" style={{ backgroundColor: '#CE1126' }}></div>
              <div className="flex-1" style={{ backgroundColor: '#FCD116' }}></div>
              <div className="flex-1" style={{ backgroundColor: '#009460' }}></div>
            </div>
            <CardContent className="p-8">
              <div className="text-center">
                <div className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: '#1A233215' }}>
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

                {/* Language — French only for now */}
                <div className="mb-8">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Globe className="w-5 h-5" style={{ color: '#009460' }} />
                    <span className="font-semibold" style={{ color: '#1A2332' }}>Langue : Français</span>
                  </div>
                  <p className="text-xs text-gray-400 text-center">Les langues nationales (Soussou, Poular, Malinké) seront bientôt disponibles</p>
                </div>

                {/* Exam Info Grid */}
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
                    <p className="text-2xl font-bold flex items-center justify-center gap-1" style={{ color: '#1A2332' }}>
                      <Volume2 className="w-5 h-5" />
                      <span className="text-sm">Français</span>
                    </p>
                    <p className="text-sm text-gray-500">Lecture audio</p>
                  </div>
                </div>

                {/* Feature highlights */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="p-3 bg-blue-50 rounded-lg text-center">
                    <ImageIcon className="w-5 h-5 mx-auto mb-1 text-blue-600" />
                    <p className="text-xs text-blue-700 font-medium">Panneaux routiers</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg text-center">
                    <Eye className="w-5 h-5 mx-auto mb-1 text-purple-600" />
                    <p className="text-xs text-purple-700 font-medium">Scénarios visuels</p>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg text-center">
                    <Volume2 className="w-5 h-5 mx-auto mb-1 text-orange-600" />
                    <p className="text-xs text-orange-700 font-medium">Lecture vocale</p>
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
                    className="text-white font-semibold px-8 py-6 text-lg"
                    style={{ backgroundColor: '#009460' }}
                    onClick={() => {
                      setExamStarted(true);
                    }}
                  >
                    Commencer l&apos;examen
                  </Button>
                  <Button variant="outline" className="py-6" onClick={() => onViewChange('candidate-dashboard')}>
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
            <div className="h-2 flex">
              <div className="flex-1" style={{ backgroundColor: '#CE1126' }}></div>
              <div className="flex-1" style={{ backgroundColor: '#FCD116' }}></div>
              <div className="flex-1" style={{ backgroundColor: '#009460' }}></div>
            </div>
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
                <Progress value={(result.score / result.totalQuestions) * 100} className="h-3 mt-4" />
                <div className="mt-3 flex items-center justify-center gap-2">
                  <Globe className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500">
                    Langue : Français
                  </span>
                </div>
              </div>

              <div className="text-left mb-6">
                <h3 className="font-semibold mb-3" style={{ color: '#1A2332' }}>Résultats par catégorie</h3>
                <div className="space-y-2">
                  {result.details.map((d, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">{d.categorie}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold" style={{ color: d.correct >= d.total * 0.75 ? '#009460' : '#CE1126' }}>
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
  if (!q) return null;

  // Language always French — use q directly

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#1A2332' }}>
      {/* Top Bar */}
      <div className="bg-white shadow-md px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="font-mono text-xs" style={{ borderColor: '#009460', color: '#009460' }}>
              {isPractice ? 'ENTRAINEMENT' : 'EXAMEN OFFICIEL'}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {user?.numeroUnique}
            </Badge>
            <Badge variant="outline" className="text-xs flex items-center gap-1" style={{ borderColor: '#FCD116', color: '#1A2332' }}>
              <Globe className="w-3 h-3" />
              Français
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Progress value={progressPercent} className="w-24 h-2" />
              <span className="text-xs text-gray-500">{answeredCount}/{totalQuestions}</span>
            </div>
            <div className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-mono font-bold ${
              timeLeft <= 300 ? 'bg-red-100 text-red-700 animate-pulse' : timeLeft <= 600 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100'
            }`}>
              <Clock className="w-4 h-4" />
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>
      </div>

      {/* Question Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto pt-6 pb-4 px-4">
          <div className="w-full max-w-4xl mx-auto">
            {/* Question Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Badge className="text-white" style={{ backgroundColor: '#009460' }}>
                  Question {currentQuestion + 1}/{totalQuestions}
                </Badge>
                <Badge variant="outline" className="text-xs">{q.categorie}</Badge>
                <Badge variant="outline" className="text-xs" style={{
                  borderColor: q.difficulte === 'facile' ? '#009460' : q.difficulte === 'moyen' ? '#FCD116' : '#CE1126',
                  color: q.difficulte === 'facile' ? '#009460' : q.difficulte === 'moyen' ? '#B8960F' : '#CE1126'
                }}>
                  {q.difficulte}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                {/* TTS compact player for question */}
                <TTSPlayer
                  text={`${q.texte}. ${q.options.map((o, i) => `Option ${String.fromCharCode(65 + i)}: ${o}`).join('. ')}`}
                  language={'fr'}
                  compact
                  showLanguageBadge={false}
                />
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

            {/* Media Section - Road Sign SVG */}
            {(q.mediaType === 'sign' || q.mediaType === 'sign+scenario') && q.signImage && (
              <div className="mb-6">
                <Card className="border-0 shadow-lg bg-white overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <ImageIcon className="w-4 h-4" style={{ color: '#009460' }} />
                      <span className="text-sm font-semibold" style={{ color: '#1A2332' }}>Panneau de signalisation</span>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                      {/* SVG Road Sign */}
                      <div
                        className="relative cursor-pointer group"
                        onClick={() => setShowSignModal(true)}
                      >
                        <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-2xl flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-white border-2 border-gray-100 shadow-inner transition-transform group-hover:scale-105">
                          <RoadSignDisplay signImage={q.signImage} size="xl" />
                        </div>
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white/90 rounded-full px-2.5 py-0.5 flex items-center gap-1 shadow-sm border">
                          <Maximize2 className="w-3 h-3 text-gray-500" />
                          <span className="text-[10px] text-gray-500">Agrandir</span>
                        </div>
                      </div>
                      {/* Question context next to sign */}
                      <div className="flex-1 text-center sm:text-left">
                        <p className="text-sm text-gray-500 italic">Observez ce panneau et répondez à la question ci-dessous</p>
                        <div className="mt-3 flex items-center gap-2 justify-center sm:justify-start">
                          <Badge variant="outline" className="text-xs" style={{ borderColor: '#009460', color: '#009460' }}>
                            {q.categorie}
                          </Badge>
                          <Badge variant="outline" className="text-xs" style={{
                            borderColor: q.difficulte === 'facile' ? '#009460' : q.difficulte === 'moyen' ? '#FCD116' : '#CE1126',
                            color: q.difficulte === 'facile' ? '#009460' : q.difficulte === 'moyen' ? '#B8960F' : '#CE1126'
                          }}>
                            {q.difficulte}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Media Section - Scenario Image */}
            {(q.mediaType === 'scenario' || q.mediaType === 'sign+scenario') && q.scenarioImage && (
              <div className="mb-6">
                <div className="relative group">
                  <div className="rounded-xl overflow-hidden border-2 border-white/20 shadow-lg cursor-pointer"
                    onClick={() => setShowScenarioModal(true)}>
                    <img
                      src={q.scenarioImage}
                      alt="Scénario routier"
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3">
                      <span className="text-white text-sm font-medium flex items-center gap-1">
                        <Eye className="w-4 h-4" /> Voir en grand
                      </span>
                    </div>
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#7C3AED' }}>
                    <Eye className="w-3 h-3 text-white" />
                  </div>
                </div>
              </div>
            )}

            {/* Video Player */}
            {q.mediaType === 'video' && (
              <div className="mb-6">
                <MockVideoPlayer
                  thumbnailUrl={q.videoThumbnail || q.scenarioImage}
                  title="Scénario vidéo — Code de la route"
                />
              </div>
            )}

            {/* TTS Player — French only for now */}

            {/* Question Text */}
            <Card className="border-0 shadow-lg mb-6">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold" style={{ color: '#1A2332' }}>
                      {q.texte}
                    </h2>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Options */}
            <div className="grid gap-3">
              {q.options.map((option, optIndex) => (
                <button
                  key={optIndex}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    answers[currentQuestion] === optIndex
                      ? 'border-green-500 bg-green-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                  }`}
                  onClick={() => handleAnswer(currentQuestion, optIndex)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                      answers[currentQuestion] === optIndex
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {String.fromCharCode(65 + optIndex)}
                    </div>
                    <span className={`font-medium flex-1 ${answers[currentQuestion] === optIndex ? 'text-green-700' : ''}`} style={answers[currentQuestion] !== optIndex ? { color: '#1A2332' } : {}}>
                      {option}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-50 hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        speakText(option);
                      }}
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Question Navigator */}
        <div className="bg-white border-t px-4 py-3">
          <div className="max-w-4xl mx-auto">
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
                      : examQuestions[i]?.mediaType === 'sign' || examQuestions[i]?.mediaType === 'scenario' || examQuestions[i]?.mediaType === 'video'
                      ? 'bg-blue-50 text-blue-600'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                  style={i === currentQuestion ? { backgroundColor: '#009460' } : {}}
                  onClick={() => setCurrentQuestion(i)}
                  title={examQuestions[i]?.mediaType !== 'text' ? `Question ${i+1} (avec image)` : `Question ${i+1}`}
                >
                  {examQuestions[i]?.mediaType === 'sign' ? <ImageIcon className="w-3.5 h-3.5" /> : examQuestions[i]?.mediaType === 'scenario' ? <Eye className="w-3.5 h-3.5" /> : examQuestions[i]?.mediaType === 'video' ? <Play className="w-3.5 h-3.5" /> : i + 1}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
              <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-green-100"></div> Répondu</span>
              <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-yellow-100"></div> Marqué</span>
              <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-blue-50"></div> Avec média</span>
            </div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="bg-white border-t px-4 py-4">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <Button
              variant="outline"
              onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
              disabled={currentQuestion === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Précédent
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className={isSpeaking ? 'text-orange-500' : 'text-gray-400'}
                onClick={speakCurrentQuestion}
              >
                {isSpeaking ? <Pause className="w-4 h-4 mr-1" /> : <Volume2 className="w-4 h-4 mr-1" />}
                {isSpeaking ? 'Arrêter' : 'Lire'}
              </Button>
              <Button
                className="text-white font-semibold"
                style={{ backgroundColor: '#CE1126' }}
                onClick={() => setShowConfirm(true)}
              >
                Terminer l&apos;examen
              </Button>
            </div>

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

      {/* Sign Modal */}
      {showSignModal && q.signImage && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowSignModal(false)}>
          <div className="max-w-lg w-full bg-white rounded-2xl p-6 relative" onClick={e => e.stopPropagation()}>
            <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-600" onClick={() => setShowSignModal(false)}>
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-semibold mb-4" style={{ color: '#1A2332' }}>Panneau de signalisation</h3>
            <div className="flex items-center justify-center p-8 bg-gray-50 rounded-xl">
              <RoadSignDisplay signImage={q.signImage} size="xl" />
            </div>
            <p className="text-center mt-4 text-gray-600">{q.explication}</p>
          </div>
        </div>
      )}

      {/* Scenario Modal */}
      {showScenarioModal && q.scenarioImage && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowScenarioModal(false)}>
          <div className="max-w-3xl w-full bg-white rounded-2xl p-6 relative" onClick={e => e.stopPropagation()}>
            <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-600" onClick={() => setShowScenarioModal(false)}>
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-semibold mb-4" style={{ color: '#1A2332' }}>Scénario routier</h3>
            <img src={q.scenarioImage} alt="Scénario" className="w-full rounded-lg object-cover" />
            <p className="text-center mt-4 text-gray-600">{q.explication}</p>
          </div>
        </div>
      )}

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
