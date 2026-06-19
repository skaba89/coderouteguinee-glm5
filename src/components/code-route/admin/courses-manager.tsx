'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth-context';
import {
  Search, Plus, Pencil, Trash2, Loader2, X, Save, BookOpen,
  ChevronRight, ChevronDown, FileText, Clock,
} from 'lucide-react';

const COLORS = {
  primaryDark: '#1A2332',
  red: '#CE1126',
  yellow: '#FCD116',
  green: '#009460',
};

const COURSE_CATEGORIES = [
  'Signalisation routière',
  'Priorités et croisements',
  'Conduite défensive',
  'Sécurité routière',
  'Infractions et sanctions',
  'Mécanique de base',
  'Premiers secours',
  'Code de la route',
];

const STATUSES = [
  { value: 'brouillon', label: 'Brouillon', color: 'bg-gray-100 text-gray-700' },
  { value: 'publie', label: 'Publié', color: 'bg-green-50 text-green-700' },
  { value: 'archive', label: 'Archivé', color: 'bg-yellow-50 text-yellow-700' },
];

const LESSON_TYPES = [
  { value: 'text', label: 'Texte' },
  { value: 'video', label: 'Vidéo' },
  { value: 'sign', label: 'Panneau' },
  { value: 'quiz', label: 'Quiz' },
  { value: 'interactive', label: 'Interactif' },
];

interface Lesson {
  id: string;
  titre: string;
  description: string;
  type: string;
  contenu: string;
  duree: number;
  ordre: number;
}

interface Course {
  id: string;
  titre: string;
  description: string;
  categorie: string;
  status: string;
  dureeTotale: number;
  nbInscrits: number;
  rating: number;
  createdAt: string;
  _count?: { lessons: number };
  lessons?: Lesson[];
}

interface CourseForm {
  titre: string;
  description: string;
  categorie: string;
  status: string;
  dureeTotale: number;
}

const emptyCourseForm: CourseForm = {
  titre: '',
  description: '',
  categorie: COURSE_CATEGORIES[0],
  status: 'brouillon',
  dureeTotale: 0,
};

interface LessonForm {
  titre: string;
  description: string;
  type: string;
  contenu: string;
  duree: number;
}

const emptyLessonForm: LessonForm = {
  titre: '',
  description: '',
  type: 'text',
  contenu: '',
  duree: 5,
};

export function CoursesManager() {
  const { apiFetch } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCat, setFilterCat] = useState('');

  // Course modal
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [courseForm, setCourseForm] = useState<CourseForm>(emptyCourseForm);
  const [savingCourse, setSavingCourse] = useState(false);
  const [courseError, setCourseError] = useState<string | null>(null);

  // Lessons panel
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loadingLessons, setLoadingLessons] = useState(false);

  // Lesson modal
  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [lessonForm, setLessonForm] = useState<LessonForm>(emptyLessonForm);
  const [savingLesson, setSavingLesson] = useState(false);
  const [lessonError, setLessonError] = useState<string | null>(null);

  // Delete confirm
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'course' | 'lesson'; item: Course | Lesson; courseId?: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadCourses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (filterStatus) params.set('status', filterStatus);
      if (filterCat) params.set('categorie', filterCat);
      const res = await apiFetch(`/api/admin/courses?${params.toString()}`);
      if (!res.ok) throw new Error('Erreur');
      const data = await res.json();
      setCourses(data.courses || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [apiFetch, search, filterStatus, filterCat]);

  useEffect(() => { loadCourses(); }, [loadCourses]);

  const loadLessons = useCallback(async (courseId: string) => {
    setLoadingLessons(true);
    try {
      const res = await apiFetch(`/api/admin/courses/${courseId}/lessons`);
      if (!res.ok) throw new Error('Erreur');
      const data = await res.json();
      setLessons(data.lessons || []);
    } catch (e) { console.error(e); }
    finally { setLoadingLessons(false); }
  }, [apiFetch]);

  const toggleExpand = (courseId: string) => {
    if (expandedCourseId === courseId) {
      setExpandedCourseId(null);
      setLessons([]);
    } else {
      setExpandedCourseId(courseId);
      loadLessons(courseId);
    }
  };

  const openCreateCourse = () => {
    setCourseForm(emptyCourseForm);
    setEditingCourseId(null);
    setCourseError(null);
    setCourseModalOpen(true);
  };

  const openEditCourse = (c: Course) => {
    setCourseForm({
      titre: c.titre,
      description: c.description,
      categorie: c.categorie,
      status: c.status,
      dureeTotale: c.dureeTotale,
    });
    setEditingCourseId(c.id);
    setCourseError(null);
    setCourseModalOpen(true);
  };

  const saveCourse = async () => {
    setCourseError(null);
    if (!courseForm.titre.trim() || !courseForm.description.trim()) {
      setCourseError('Titre et description sont requis');
      return;
    }
    setSavingCourse(true);
    try {
      const body = {
        titre: courseForm.titre.trim(),
        description: courseForm.description.trim(),
        categorie: courseForm.categorie,
        status: courseForm.status,
        dureeTotale: Number(courseForm.dureeTotale) || 0,
      };
      let res: Response;
      if (editingCourseId) {
        res = await apiFetch(`/api/admin/courses/${editingCourseId}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        });
      } else {
        res = await apiFetch('/api/admin/courses', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        });
      }
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Erreur');
      }
      setCourseModalOpen(false);
      loadCourses();
    } catch (e: unknown) {
      setCourseError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setSavingCourse(false);
    }
  };

  const openCreateLesson = () => {
    setLessonForm(emptyLessonForm);
    setEditingLessonId(null);
    setLessonError(null);
    setLessonModalOpen(true);
  };

  const openEditLesson = (l: Lesson) => {
    setLessonForm({
      titre: l.titre,
      description: l.description,
      type: l.type,
      contenu: l.contenu,
      duree: l.duree,
    });
    setEditingLessonId(l.id);
    setLessonError(null);
    setLessonModalOpen(true);
  };

  const saveLesson = async () => {
    if (!expandedCourseId) return;
    setLessonError(null);
    if (!lessonForm.titre.trim() || !lessonForm.contenu.trim()) {
      setLessonError('Titre et contenu sont requis');
      return;
    }
    setSavingLesson(true);
    try {
      const body = {
        titre: lessonForm.titre.trim(),
        description: lessonForm.description.trim(),
        type: lessonForm.type,
        contenu: lessonForm.contenu.trim(),
        duree: Number(lessonForm.duree) || 5,
      };
      let res: Response;
      if (editingLessonId) {
        res = await apiFetch(`/api/admin/courses/${expandedCourseId}/lessons/${editingLessonId}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        });
      } else {
        res = await apiFetch(`/api/admin/courses/${expandedCourseId}/lessons`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        });
      }
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Erreur');
      }
      setLessonModalOpen(false);
      loadLessons(expandedCourseId);
      loadCourses();
    } catch (e: unknown) {
      setLessonError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setSavingLesson(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      let res: Response;
      if (confirmDelete.type === 'course') {
        res = await apiFetch(`/api/admin/courses/${confirmDelete.item.id}`, { method: 'DELETE' });
      } else {
        res = await apiFetch(`/api/admin/courses/${confirmDelete.courseId}/lessons/${confirmDelete.item.id}`, { method: 'DELETE' });
      }
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Erreur');
      }
      setConfirmDelete(null);
      if (confirmDelete.type === 'course') {
        if (expandedCourseId === confirmDelete.item.id) {
          setExpandedCourseId(null);
          setLessons([]);
        }
        loadCourses();
      } else {
        if (expandedCourseId) loadLessons(expandedCourseId);
        loadCourses();
      }
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card className="border-0 shadow-sm bg-white">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: COLORS.primaryDark }}>
            <BookOpen className="w-4 h-4" style={{ color: COLORS.green }} />
            Gestion des cours
            <Badge variant="outline" className="ml-2 text-[10px]">{courses.length} cours</Badge>
          </CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                className="h-7 text-xs border border-gray-300 rounded-md pl-8 pr-3 bg-white w-44"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select
              className="h-7 text-xs border border-gray-300 rounded-md px-2 bg-white"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
            >
              <option value="">Tous statuts</option>
              {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <select
              className="h-7 text-xs border border-gray-300 rounded-md px-2 bg-white"
              value={filterCat}
              onChange={e => setFilterCat(e.target.value)}
            >
              <option value="">Toutes catégories</option>
              {COURSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <Button size="sm" className="h-7 text-xs gap-1" style={{ background: COLORS.green, color: 'white' }} onClick={openCreateCourse}>
              <Plus className="w-3 h-3" />
              Nouveau cours
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="py-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto" style={{ color: COLORS.green }} />
          </div>
        ) : courses.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <BookOpen className="w-10 h-10 mx-auto mb-2" />
            <p className="text-sm">Aucun cours trouvé</p>
          </div>
        ) : (
          <div className="space-y-2">
            {courses.map((c) => (
              <div key={c.id} className="border border-gray-200 rounded-md overflow-hidden">
                <div
                  className="flex items-center justify-between p-3 hover:bg-gray-50/50 cursor-pointer"
                  onClick={() => toggleExpand(c.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {expandedCourseId === c.id ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold" style={{ color: COLORS.primaryDark }}>{c.titre}</p>
                        <Badge className={`text-[10px] ${STATUSES.find(s => s.value === c.status)?.color || 'bg-gray-100'}`}>
                          {STATUSES.find(s => s.value === c.status)?.label || c.status}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">{c.categorie}</Badge>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{c.description}</p>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-400">
                        <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {c._count?.lessons || 0} leçon(s)</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {c.dureeTotale} min</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEditCourse(c)}>
                      <Pencil className="w-3 h-3" style={{ color: COLORS.green }} />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setConfirmDelete({ type: 'course', item: c })}>
                      <Trash2 className="w-3 h-3" style={{ color: COLORS.red }} />
                    </Button>
                  </div>
                </div>

                {expandedCourseId === c.id && (
                  <div className="bg-gray-50/50 border-t border-gray-200 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Leçons du cours</p>
                      <Button size="sm" variant="outline" className="h-6 text-[10px] gap-1" onClick={openCreateLesson} style={{ borderColor: COLORS.green, color: COLORS.green }}>
                        <Plus className="w-3 h-3" /> Ajouter une leçon
                      </Button>
                    </div>
                    {loadingLessons ? (
                      <div className="py-4 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto" style={{ color: COLORS.green }} /></div>
                    ) : lessons.length === 0 ? (
                      <p className="text-xs text-gray-400 py-4 text-center">Aucune leçon. Cliquez sur « Ajouter une leçon ».</p>
                    ) : (
                      <div className="space-y-1">
                        {lessons.map((l, i) => (
                          <div key={l.id} className="flex items-center justify-between bg-white border border-gray-200 rounded p-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="text-[10px] font-mono text-gray-400">#{i + 1}</span>
                              <div className="min-w-0">
                                <p className="text-xs font-medium" style={{ color: COLORS.primaryDark }}>{l.titre}</p>
                                <p className="text-[10px] text-gray-500">
                                  <Badge variant="outline" className="text-[9px] mr-1">{LESSON_TYPES.find(t => t.value === l.type)?.label || l.type}</Badge>
                                  • {l.duree} min
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => openEditLesson(l)}>
                                <Pencil className="w-3 h-3" style={{ color: COLORS.green }} />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setConfirmDelete({ type: 'lesson', item: l, courseId: c.id })}>
                                <Trash2 className="w-3 h-3" style={{ color: COLORS.red }} />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Course modal */}
      {courseModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold" style={{ color: COLORS.primaryDark }}>
                {editingCourseId ? 'Modifier le cours' : 'Nouveau cours'}
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setCourseModalOpen(false)} className="h-7 w-7 p-0"><X className="w-4 h-4" /></Button>
            </div>
            <div className="p-6 space-y-4">
              {courseError && <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700">{courseError}</div>}
              <div>
                <label className="block text-[11px] font-semibold mb-1" style={{ color: COLORS.primaryDark }}>Titre *</label>
                <input type="text" className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5" value={courseForm.titre} onChange={e => setCourseForm({ ...courseForm, titre: e.target.value })} />
              </div>
              <div>
                <label className="block text-[11px] font-semibold mb-1" style={{ color: COLORS.primaryDark }}>Description *</label>
                <textarea className="w-full text-xs border border-gray-300 rounded-md p-2 min-h-[80px]" value={courseForm.description} onChange={e => setCourseForm({ ...courseForm, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold mb-1" style={{ color: COLORS.primaryDark }}>Catégorie</label>
                  <select className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5" value={courseForm.categorie} onChange={e => setCourseForm({ ...courseForm, categorie: e.target.value })}>
                    {COURSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold mb-1" style={{ color: COLORS.primaryDark }}>Statut</label>
                  <select className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5" value={courseForm.status} onChange={e => setCourseForm({ ...courseForm, status: e.target.value })}>
                    {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold mb-1" style={{ color: COLORS.primaryDark }}>Durée totale (minutes) — auto-calculée si vide</label>
                <input type="number" min={0} className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5" value={courseForm.dureeTotale} onChange={e => setCourseForm({ ...courseForm, dureeTotale: Number(e.target.value) })} />
              </div>
            </div>
            <div className="sticky bottom-0 bg-white border-t px-6 py-3 flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setCourseModalOpen(false)} className="text-xs">Annuler</Button>
              <Button size="sm" onClick={saveCourse} disabled={savingCourse} className="text-xs gap-1" style={{ background: COLORS.green, color: 'white' }}>
                {savingCourse ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                {editingCourseId ? 'Enregistrer' : 'Créer'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Lesson modal */}
      {lessonModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold" style={{ color: COLORS.primaryDark }}>
                {editingLessonId ? 'Modifier la leçon' : 'Nouvelle leçon'}
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setLessonModalOpen(false)} className="h-7 w-7 p-0"><X className="w-4 h-4" /></Button>
            </div>
            <div className="p-6 space-y-4">
              {lessonError && <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700">{lessonError}</div>}
              <div>
                <label className="block text-[11px] font-semibold mb-1" style={{ color: COLORS.primaryDark }}>Titre *</label>
                <input type="text" className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5" value={lessonForm.titre} onChange={e => setLessonForm({ ...lessonForm, titre: e.target.value })} />
              </div>
              <div>
                <label className="block text-[11px] font-semibold mb-1" style={{ color: COLORS.primaryDark }}>Description courte</label>
                <input type="text" className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5" value={lessonForm.description} onChange={e => setLessonForm({ ...lessonForm, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold mb-1" style={{ color: COLORS.primaryDark }}>Type</label>
                  <select className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5" value={lessonForm.type} onChange={e => setLessonForm({ ...lessonForm, type: e.target.value })}>
                    {LESSON_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold mb-1" style={{ color: COLORS.primaryDark }}>Durée (minutes)</label>
                  <input type="number" min={1} max={120} className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5" value={lessonForm.duree} onChange={e => setLessonForm({ ...lessonForm, duree: Number(e.target.value) })} />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold mb-1" style={{ color: COLORS.primaryDark }}>Contenu *</label>
                <textarea className="w-full text-xs border border-gray-300 rounded-md p-2 min-h-[150px] font-mono" value={lessonForm.contenu} onChange={e => setLessonForm({ ...lessonForm, contenu: e.target.value })} placeholder="Contenu de la leçon (texte, HTML simple accepté)" />
              </div>
            </div>
            <div className="sticky bottom-0 bg-white border-t px-6 py-3 flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setLessonModalOpen(false)} className="text-xs">Annuler</Button>
              <Button size="sm" onClick={saveLesson} disabled={savingLesson} className="text-xs gap-1" style={{ background: COLORS.green, color: 'white' }}>
                {savingLesson ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                {editingLessonId ? 'Enregistrer' : 'Créer'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                <Trash2 className="w-5 h-5" style={{ color: COLORS.red }} />
              </div>
              <h3 className="text-sm font-semibold" style={{ color: COLORS.primaryDark }}>
                Supprimer {confirmDelete.type === 'course' ? 'le cours' : 'la leçon'} ?
              </h3>
            </div>
            <p className="text-xs text-gray-600 mb-4">
              {confirmDelete.type === 'course'
                ? 'Cette action supprimera aussi toutes les leçons associées. Action irréversible.'
                : 'Cette action est irréversible.'}
            </p>
            <p className="text-[11px] text-gray-500 italic mb-4">
              {confirmDelete.type === 'course'
                ? (confirmDelete.item as Course).titre
                : (confirmDelete.item as Lesson).titre}
            </p>
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setConfirmDelete(null)} className="text-xs">Annuler</Button>
              <Button size="sm" onClick={handleDelete} disabled={deleting} className="text-xs gap-1" style={{ background: COLORS.red, color: 'white' }}>
                {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                Supprimer
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
