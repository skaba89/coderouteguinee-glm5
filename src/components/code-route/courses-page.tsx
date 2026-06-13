'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ViewType, Course, NationalLanguage, Lesson, LessonType } from '@/lib/types';
import { courses, getLanguageName } from '@/lib/mock-data';
import { useLanguage } from '@/lib/language-context';
import { RoadSignDisplay } from '@/components/code-route/road-signs';
import TTSPlayer from '@/components/code-route/tts-player';
import {
  BookOpen,
  Play,
  ChevronRight,
  Star,
  Clock,
  Users,
  Award,
  CheckCircle,
  Image as ImageIcon,
  Video,
  FileText,
  Headphones,
  ChevronDown,
  Volume2,
  VolumeX,
  Loader2,
  X,
  Film,
} from 'lucide-react';

// ─── Color palette ──────────────────────────────────────────
const COLORS = {
  primaryDark: '#1A2332',
  red: '#CE1126',
  yellow: '#FCD116',
  green: '#009460',
};

// ─── Category config ────────────────────────────────────────
const categoryConfig: Record<string, { color: string; bg: string; border: string }> = {
  Signalisation: { color: '#1A2332', bg: '#E8F0FE', border: '#1A2332' },
  Priorité: { color: '#CE1126', bg: '#FDEAEA', border: '#CE1126' },
  Sécurité: { color: '#009460', bg: '#E6F5EE', border: '#009460' },
};

function getCategoryStyle(cat: string) {
  return categoryConfig[cat] || { color: '#1A2332', bg: '#F3F4F6', border: '#1A2332' };
}

// ─── Lesson type icon ───────────────────────────────────────
function LessonTypeIcon({ type, className }: { type: LessonType; className?: string }) {
  const cls = className || 'h-4 w-4';
  switch (type) {
    case 'sign':
      return <ImageIcon className={cls} />;
    case 'video':
      return <Video className={cls} />;
    case 'text':
      return <FileText className={cls} />;
    case 'quiz':
      return <Award className={cls} />;
    case 'interactive':
      return <Play className={cls} />;
    default:
      return <BookOpen className={cls} />;
  }
}

// ─── Helpers ────────────────────────────────────────────────
function getLocalizedCourseTitle(course: Course, lang: NationalLanguage): string {
  if (lang !== 'fr' && course.translations[lang]?.titre) {
    return course.translations[lang]!.titre;
  }
  return course.titre;
}

function getLocalizedCourseDesc(course: Course, lang: NationalLanguage): string {
  if (lang !== 'fr' && course.translations[lang]?.description) {
    return course.translations[lang]!.description;
  }
  return course.description;
}

function getLocalizedLessonTitle(lesson: Lesson, lang: NationalLanguage): string {
  if (lang !== 'fr' && lesson.translations[lang]?.titre) {
    return lesson.translations[lang]!.titre;
  }
  return lesson.titre;
}

function getLocalizedLessonDesc(lesson: Lesson, lang: NationalLanguage): string {
  if (lang !== 'fr' && lesson.translations[lang]?.description) {
    return lesson.translations[lang]!.description;
  }
  return lesson.description;
}

function getLocalizedLessonContent(lesson: Lesson, lang: NationalLanguage): string {
  if (lang !== 'fr' && lesson.translations[lang]?.contenu) {
    return lesson.translations[lang]!.contenu;
  }
  return lesson.contenu;
}

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

function renderStars(rating: number) {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.3;
  const stars = [];
  for (let i = 0; i < 5; i++) {
    if (i < full) {
      stars.push(<Star key={i} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />);
    } else if (i === full && hasHalf) {
      stars.push(
        <div key={i} className="relative">
          <Star className="h-3.5 w-3.5 text-gray-300" />
          <div className="absolute inset-0 overflow-hidden w-[50%]">
            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
          </div>
        </div>
      );
    } else {
      stars.push(<Star key={i} className="h-3.5 w-3.5 text-gray-300" />);
    }
  }
  return stars;
}

// ─── Mock progress generator ────────────────────────────────
function getMockProgress(courseId: string): number {
  const map: Record<string, number> = {
    'CRS-001': 35,
    'CRS-002': 0,
    'CRS-003': 100,
  };
  return map[courseId] ?? 0;
}

// ─── Main Component ─────────────────────────────────────────
export default function CoursesPage({ onViewChange }: { onViewChange: (view: ViewType) => void }) {
  const { currentLanguage, languageConfig } = useLanguage();

  // State
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);
  const [expandedLessonId, setExpandedLessonId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [speakingLessonId, setSpeakingLessonId] = useState<string | null>(null);

  // ── Filter courses ──
  const filteredCourses = courses.filter((course) => {
    const progress = getMockProgress(course.id);
    switch (activeTab) {
      case 'in-progress':
        return progress > 0 && progress < 100;
      case 'completed':
        return progress === 100;
      case 'signalisation':
        return course.categorie === 'Signalisation';
      case 'priorite':
        return course.categorie === 'Priorité';
      case 'securite':
        return course.categorie === 'Sécurité';
      default:
        return true;
    }
  });

  // ── Stats ──
  const totalLessons = courses.reduce((acc, c) => acc + c.lessons.length, 0);
  const totalDuration = courses.reduce((acc, c) => acc + c.dureeTotale, 0);

  return (
    <div className="min-h-screen bg-gray-50" style={{ backgroundColor: '#F7F8FA' }}>
      {/* ── Header ── */}
      <div
        className="relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${COLORS.primaryDark} 0%, #2A3A52 50%, ${COLORS.primaryDark} 100%)`,
        }}
      >
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-10"
            style={{ background: COLORS.green }}
          />
          <div
            className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full opacity-10"
            style={{ background: COLORS.yellow }}
          />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          {/* Language badge */}
          <div className="flex items-center justify-end mb-6">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
              style={{ backgroundColor: 'rgba(255,255,255,0.12)', color: '#fff' }}
            >
              <span>{languageConfig.flag}</span>
              <span>
                {getLanguageName(currentLanguage)} · {languageConfig.nativeName}
              </span>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 tracking-tight">
              Cours et{' '}
              <span style={{ color: COLORS.green }}>formation</span>
            </h1>
            <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto">
              Préparez-vous à l&apos;examen du code de la route
            </p>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
            <StatItem
              icon={<BookOpen className="h-5 w-5" style={{ color: COLORS.green }} />}
              value={courses.length.toString()}
              label="Cours"
            />
            <StatItem
              icon={<FileText className="h-5 w-5" style={{ color: COLORS.yellow }} />}
              value={totalLessons.toString()}
              label="Leçons"
            />
            <StatItem
              icon={<Clock className="h-5 w-5" style={{ color: COLORS.red }} />}
              value={`${totalDuration} min`}
              label="De contenu"
            />
          </div>

          {/* Guinea stripe */}
          <div className="mt-8 flex h-1.5 rounded-full overflow-hidden max-w-md mx-auto">
            <div className="flex-1" style={{ backgroundColor: COLORS.red }} />
            <div className="flex-1" style={{ backgroundColor: COLORS.yellow }} />
            <div className="flex-1" style={{ backgroundColor: COLORS.green }} />
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList
            className="h-auto p-1 bg-white rounded-xl shadow-sm flex flex-wrap gap-1"
            style={{ border: '1px solid #E5E7EB' }}
          >
            {[
              { value: 'all', label: 'Tous les cours', color: COLORS.primaryDark },
              { value: 'in-progress', label: 'En cours', color: COLORS.green },
              { value: 'completed', label: 'Terminés', color: COLORS.green },
              { value: 'signalisation', label: 'Signalisation', color: COLORS.primaryDark },
              { value: 'priorite', label: 'Priorité', color: COLORS.red },
              { value: 'securite', label: 'Sécurité', color: COLORS.green },
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="rounded-lg data-[state=active]:text-white data-[state=active]:shadow-sm text-sm px-4 py-2"
                style={activeTab === tab.value ? { backgroundColor: tab.color } : {}}
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {['all', 'in-progress', 'completed', 'signalisation', 'priorite', 'securite'].map(
            (tabVal) => (
              <TabsContent key={tabVal} value={tabVal} className="mt-6">
                {filteredCourses.length === 0 ? (
                  <EmptyState tab={tabVal} />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCourses.map((course) => (
                      <CourseCard
                        key={course.id}
                        course={course}
                        lang={currentLanguage}
                        isExpanded={expandedCourseId === course.id}
                        expandedLessonId={expandedLessonId}
                        speakingLessonId={speakingLessonId}
                        onToggleExpand={() =>
                          setExpandedCourseId(
                            expandedCourseId === course.id ? null : course.id
                          )
                        }
                        onToggleLesson={(lessonId) =>
                          setExpandedLessonId(
                            expandedLessonId === lessonId ? null : lessonId
                          )
                        }
                        onSpeak={(lessonId) =>
                          setSpeakingLessonId(
                            speakingLessonId === lessonId ? null : lessonId
                          )
                        }
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            )
          )}
        </Tabs>
      </div>
    </div>
  );
}

// ─── Stat Item ──────────────────────────────────────────────
function StatItem({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm">
        {icon}
      </div>
      <div>
        <div className="text-xl sm:text-2xl font-bold text-white">{value}</div>
        <div className="text-xs sm:text-sm text-gray-400">{label}</div>
      </div>
    </div>
  );
}

// ─── Empty State ────────────────────────────────────────────
function EmptyState({ tab }: { tab: string }) {
  const messages: Record<string, string> = {
    'in-progress': "Vous n'avez pas encore commencé de cours. Lancez-vous !",
    completed: 'Aucun cours terminé pour le moment. Continuez vos études !',
    signalisation: 'Aucun cours de signalisation disponible.',
    priorite: 'Aucun cours sur les priorités disponible.',
    securite: 'Aucun cours de sécurité disponible.',
    all: 'Aucun cours disponible.',
  };
  return (
    <div className="text-center py-16">
      <BookOpen className="h-12 w-12 mx-auto text-gray-300 mb-4" />
      <p className="text-gray-500 text-lg">{messages[tab] || messages.all}</p>
    </div>
  );
}

// ─── Course Card ────────────────────────────────────────────
function CourseCard({
  course,
  lang,
  isExpanded,
  expandedLessonId,
  speakingLessonId,
  onToggleExpand,
  onToggleLesson,
  onSpeak,
}: {
  course: Course;
  lang: NationalLanguage;
  isExpanded: boolean;
  expandedLessonId: string | null;
  speakingLessonId: string | null;
  onToggleExpand: () => void;
  onToggleLesson: (lessonId: string) => void;
  onSpeak: (lessonId: string) => void;
}) {
  const progress = getMockProgress(course.id);
  const catStyle = getCategoryStyle(course.categorie);
  const coverImage = course.imageCover || course.lessons.find((l) => l.signImage)?.signImage;
  const isCompleted = progress === 100;
  const isInProgress = progress > 0 && progress < 100;

  return (
    <Card
      className={`overflow-hidden transition-all duration-300 shadow-md hover:shadow-xl rounded-2xl border-0 ${
        isExpanded ? 'md:col-span-2 lg:col-span-3' : ''
      }`}
      style={{ backgroundColor: '#FFFFFF' }}
    >
      {/* Cover image with road sign SVGs */}
      {!isExpanded && coverImage && (
        <div className="relative h-40 overflow-hidden">
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${catStyle.bg} 0%, ${COLORS.primaryDark}15 100%)`,
            }}
          >
            <div className="text-center">
              <RoadSignDisplay signImage={coverImage} size="lg" />
            </div>
          </div>
          {/* Category badge overlay */}
          <div className="absolute top-3 left-3">
            <Badge
              className="font-semibold text-xs px-3 py-1 border-0 shadow-sm"
              style={{
                backgroundColor: catStyle.bg,
                color: catStyle.color,
              }}
            >
              {course.categorie}
            </Badge>
          </div>
          {/* Completion overlay */}
          {isCompleted && (
            <div className="absolute top-3 right-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
                style={{ backgroundColor: COLORS.green }}
              >
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
            </div>
          )}
        </div>
      )}

      <CardHeader className={`${isExpanded ? 'pb-2' : 'pb-3'} pt-4 px-5`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Category badge (shown when expanded, no cover) */}
            {isExpanded && (
              <Badge
                className="font-semibold text-xs px-3 py-1 border-0 shadow-sm mb-3"
                style={{
                  backgroundColor: catStyle.bg,
                  color: catStyle.color,
                }}
              >
                {course.categorie}
              </Badge>
            )}
            <CardTitle
              className="text-lg font-bold leading-snug"
              style={{ color: COLORS.primaryDark }}
            >
              {getLocalizedCourseTitle(course, lang)}
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
              {getLocalizedCourseDesc(course, lang)}
            </p>
          </div>
          {isExpanded && isCompleted && (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm flex-shrink-0"
              style={{ backgroundColor: COLORS.green }}
            >
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="px-5 pb-4 pt-0">
        {/* Meta info */}
        <div className="flex items-center gap-4 mb-3 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            {renderStars(course.rating)}
            <span className="font-semibold text-gray-700 ml-1">{course.rating}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            <span>{course.dureeTotale} min</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            <span>{formatNumber(course.nbInscrits)}</span>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-gray-600">
              {isCompleted
                ? 'Terminé'
                : isInProgress
                ? 'En cours'
                : 'Non commencé'}
            </span>
            <span className="text-xs font-bold" style={{ color: isCompleted ? COLORS.green : COLORS.primaryDark }}>
              {progress}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progress}%`,
                backgroundColor: isCompleted ? COLORS.green : isInProgress ? COLORS.yellow : '#E5E7EB',
              }}
            />
          </div>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-2">
          <Button
            className="flex-1 font-semibold text-sm rounded-xl h-10 shadow-sm transition-all"
            style={{
              backgroundColor: isInProgress || isCompleted ? COLORS.primaryDark : COLORS.green,
              color: '#FFFFFF',
            }}
            onClick={onToggleExpand}
          >
            {isCompleted ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Réviser
              </>
            ) : isInProgress ? (
              <>
                <Play className="h-4 w-4 mr-2" />
                Continuer
              </>
            ) : (
              <>
                <BookOpen className="h-4 w-4 mr-2" />
                Commencer
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-xl border-0 shadow-sm"
            style={{ backgroundColor: '#F3F4F6' }}
            onClick={onToggleExpand}
          >
            <ChevronRight
              className={`h-4 w-4 transition-transform duration-300 ${
                isExpanded ? 'rotate-90' : ''
              }`}
            />
          </Button>
        </div>

        {/* ── Expanded: Lessons list ── */}
        {isExpanded && (
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold" style={{ color: COLORS.primaryDark }}>
                Leçons ({course.lessons.length})
              </h3>
              <span className="text-xs text-gray-400">
                {course.dureeTotale} min au total
              </span>
            </div>

            <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
              {course.lessons
                .sort((a, b) => a.ordre - b.ordre)
                .map((lesson, idx) => {
                  const isLessonExpanded = expandedLessonId === lesson.id;
                  const isSpeaking = speakingLessonId === lesson.id;
                  const lessonProgress = getLessonProgress(lesson, progress, course, idx);

                  return (
                    <div key={lesson.id} className="rounded-xl overflow-hidden">
                      {/* Lesson row */}
                      <button
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left"
                        style={{
                          backgroundColor: isLessonExpanded ? '#F0F4F8' : '#FAFBFC',
                        }}
                        onClick={() => onToggleLesson(lesson.id)}
                      >
                        {/* Type icon */}
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{
                            backgroundColor: getLessonTypeBg(lesson.type),
                          }}
                        >
                          <LessonTypeIcon
                            type={lesson.type}
                            className="h-4 w-4"
                          />
                        </div>

                        {/* Lesson info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-800 truncate">
                              {getLocalizedLessonTitle(lesson, lang)}
                            </span>
                            {lessonProgress === 'completed' && (
                              <CheckCircle className="h-4 w-4 flex-shrink-0" style={{ color: COLORS.green }} />
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-gray-400">
                              {lesson.duree} min
                            </span>
                            <span className="text-xs px-1.5 py-0.5 rounded-md font-medium" style={{
                              backgroundColor: getLessonTypeBg(lesson.type),
                              color: getLessonTypeColor(lesson.type),
                            }}>
                              {getLessonTypeLabel(lesson.type)}
                            </span>
                          </div>
                        </div>

                        {/* Expand chevron */}
                        <ChevronDown
                          className={`h-4 w-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ${
                            isLessonExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </button>

                      {/* Expanded lesson content */}
                      {isLessonExpanded && (
                        <div className="px-4 pb-4 pt-2 space-y-3">
                          {/* Lesson description */}
                          <p className="text-sm text-gray-600">
                            {getLocalizedLessonDesc(lesson, lang)}
                          </p>

                          {/* Road Sign SVG display */}
                          {lesson.type === 'sign' && lesson.signImage && (
                            <div
                              className="rounded-xl overflow-hidden flex items-center justify-center p-6"
                              style={{
                                background: `linear-gradient(135deg, #F0F4F8 0%, #E8EDF2 100%)`,
                              }}
                            >
                              <div className="text-center">
                                <div className="mx-auto mb-3">
                                  <RoadSignDisplay signImage={lesson.signImage} size="xl" />
                                </div>
                                <span className="text-xs text-gray-500 italic">
                                  Panneau de signalisation
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Scenario image */}
                          {(lesson.type === 'interactive') && lesson.scenarioImage && (
                            <div
                              className="rounded-xl overflow-hidden flex items-center justify-center p-6"
                              style={{
                                background: `linear-gradient(135deg, #F0F4F8 0%, #E8EDF2 100%)`,
                              }}
                            >
                              <div className="text-center">
                                <div
                                  className="w-full max-w-sm h-40 mx-auto rounded-2xl flex items-center justify-center mb-3 shadow-inner"
                                  style={{ backgroundColor: '#fff' }}
                                >
                                  <div className="text-center">
                                    <Play className="h-10 w-10 mx-auto text-gray-300" />
                                    <span className="text-xs text-gray-400 block mt-1">Scénario interactif</span>
                                  </div>
                                </div>
                                <span className="text-xs text-gray-500 italic">
                                  {lesson.scenarioImage}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Video placeholder with styled player */}
                          {lesson.type === 'video' && (
                            <div
                              className="rounded-xl overflow-hidden"
                              style={{
                                background: `linear-gradient(135deg, #1A2332 0%, #2A3A52 100%)`,
                              }}
                            >
                              <div className="relative aspect-video max-h-44 flex items-center justify-center">
                                <Film className="w-12 h-12 text-white/20" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white/20 backdrop-blur-sm border border-white/30 cursor-pointer hover:bg-white/30 transition-colors">
                                    <Play className="w-6 h-6 text-white ml-0.5" />
                                  </div>
                                </div>
                                <div className="absolute top-2 left-2">
                                  <Badge className="text-[10px] px-2 py-0.5 bg-red-600 text-white border-0">
                                    <Video className="w-3 h-3 mr-1" />
                                    VIDEO
                                  </Badge>
                                </div>
                              </div>
                              <div className="h-1 bg-gray-700">
                                <div className="h-full w-0 bg-red-600" />
                              </div>
                              <div className="flex items-center gap-3 px-3 py-2">
                                <Play className="w-3.5 h-3.5 text-white" />
                                <span className="text-xs text-gray-400 flex-1">Lecteur vidéo</span>
                              </div>
                            </div>
                          )}

                          {/* Lesson content text */}
                          <div
                            className="p-4 rounded-xl text-sm leading-relaxed"
                            style={{
                              backgroundColor: '#F8FAFB',
                              color: COLORS.primaryDark,
                              borderLeft: `3px solid ${COLORS.green}`,
                            }}
                          >
                            {getLocalizedLessonContent(lesson, lang)}
                          </div>

                          {/* TTS Player */}
                          <TTSPlayer
                            text={getLocalizedLessonContent(lesson, lang)}
                            language={lang}
                            showLanguageBadge={lang !== 'fr'}
                            label={`Leçon : ${getLocalizedLessonTitle(lesson, lang)}`}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Helpers for lesson display ─────────────────────────────
function getLessonTypeBg(type: LessonType): string {
  switch (type) {
    case 'sign':
      return '#E8F0FE';
    case 'video':
      return '#FDEAEA';
    case 'text':
      return '#E6F5EE';
    case 'quiz':
      return '#FFF8E1';
    case 'interactive':
      return '#F3E8FF';
    default:
      return '#F3F4F6';
  }
}

function getLessonTypeColor(type: LessonType): string {
  switch (type) {
    case 'sign':
      return '#1A2332';
    case 'video':
      return '#CE1126';
    case 'text':
      return '#009460';
    case 'quiz':
      return '#B8860B';
    case 'interactive':
      return '#7C3AED';
    default:
      return '#6B7280';
  }
}

function getLessonTypeLabel(type: LessonType): string {
  switch (type) {
    case 'sign':
      return 'Signalisation';
    case 'video':
      return 'Vidéo';
    case 'text':
      return 'Texte';
    case 'quiz':
      return 'Quiz';
    case 'interactive':
      return 'Interactif';
    default:
      return type;
  }
}

function getLessonProgress(
  lesson: Lesson,
  courseProgress: number,
  course: Course,
  lessonIdx: number
): 'completed' | 'in-progress' | 'not-started' {
  if (courseProgress === 0) return 'not-started';
  if (courseProgress === 100) return 'completed';

  const sorted = [...course.lessons].sort((a, b) => a.ordre - b.ordre);
  const lessonProgress = (courseProgress / 100) * sorted.length;
  const completedCount = Math.floor(lessonProgress);

  if (lessonIdx < completedCount) return 'completed';
  if (lessonIdx === completedCount) return 'in-progress';
  return 'not-started';
}
