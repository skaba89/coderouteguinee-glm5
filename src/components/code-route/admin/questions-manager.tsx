'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth-context';
import {
  Search, Filter, Plus, Pencil, Trash2, ToggleLeft, ToggleRight,
  Loader2, X, Save, ListChecks, FileQuestion,
} from 'lucide-react';

const COLORS = {
  primaryDark: '#1A2332',
  red: '#CE1126',
  yellow: '#FCD116',
  green: '#009460',
};

const CATEGORIES = ['Signalisation', 'Priorités', 'Conduite', 'Sécurité', 'Infractions'];
const DIFFICULTIES = ['facile', 'moyen', 'difficile'];
const MEDIA_TYPES = [
  { value: 'text', label: 'Texte' },
  { value: 'sign', label: 'Panneau' },
  { value: 'scenario', label: 'Scénario' },
  { value: 'video', label: 'Vidéo' },
  { value: 'sign+scenario', label: 'Panneau+Scénario' },
];

interface Question {
  id: number;
  texte: string;
  options: string[];
  bonneReponse: number;
  categorie: string;
  difficulte: string;
  mediaType: string;
  explication: string;
  points: number;
  tempsEstime: number;
  tags: string[];
  actif: boolean;
  createdAt: string;
}

interface FormState {
  texte: string;
  options: string[];
  bonneReponse: number;
  categorie: string;
  difficulte: string;
  mediaType: string;
  explication: string;
  points: number;
  tempsEstime: number;
  tagsInput: string;
}

const emptyForm: FormState = {
  texte: '',
  options: ['', '', '', ''],
  bonneReponse: 0,
  categorie: 'Signalisation',
  difficulte: 'facile',
  mediaType: 'text',
  explication: '',
  points: 1,
  tempsEstime: 20,
  tagsInput: '',
};

export function QuestionsManager() {
  const { apiFetch } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterDiff, setFilterDiff] = useState('');
  const [filterMedia, setFilterMedia] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Confirm delete
  const [confirmDelete, setConfirmDelete] = useState<Question | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (filterCat) params.set('categorie', filterCat);
      if (filterDiff) params.set('difficulte', filterDiff);
      if (filterMedia) params.set('mediaType', filterMedia);
      params.set('page', String(page));
      params.set('limit', '50');

      const res = await apiFetch(`/api/admin/questions?${params.toString()}`);
      if (!res.ok) throw new Error('Erreur de chargement');
      const data = await res.json();
      setQuestions(data.questions || []);
      setTotal(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [apiFetch, search, filterCat, filterDiff, filterMedia, page]);

  useEffect(() => { loadQuestions(); }, [loadQuestions]);

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (q: Question) => {
    setForm({
      texte: q.texte,
      options: q.options.length >= 2 ? q.options : [...q.options, '', ''].slice(0, 4),
      bonneReponse: q.bonneReponse,
      categorie: q.categorie,
      difficulte: q.difficulte,
      mediaType: q.mediaType,
      explication: q.explication,
      points: q.points,
      tempsEstime: q.tempsEstime,
      tagsInput: (q.tags || []).join(', '),
    });
    setEditingId(q.id);
    setFormError(null);
    setModalOpen(true);
  };

  const handleSave = async () => {
    setFormError(null);
    if (!form.texte.trim()) {
      setFormError('Le texte de la question est requis');
      return;
    }
    if (form.options.filter(o => o.trim()).length < 2) {
      setFormError('Au moins 2 options non vides sont requises');
      return;
    }
    if (!form.explication.trim()) {
      setFormError('L\'explication est requise');
      return;
    }

    setSaving(true);
    try {
      const cleanedOptions = form.options.map(o => o.trim()).filter(Boolean);
      const body = {
        texte: form.texte.trim(),
        options: cleanedOptions,
        bonneReponse: Math.min(form.bonneReponse, cleanedOptions.length - 1),
        categorie: form.categorie,
        difficulte: form.difficulte,
        mediaType: form.mediaType,
        explication: form.explication.trim(),
        points: Number(form.points) || 1,
        tempsEstime: Number(form.tempsEstime) || 20,
        tags: form.tagsInput.split(',').map(t => t.trim()).filter(Boolean),
      };

      let res: Response;
      if (editingId) {
        res = await apiFetch(`/api/admin/questions/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } else {
        res = await apiFetch('/api/admin/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Erreur lors de l\'enregistrement');
      }

      setModalOpen(false);
      loadQuestions();
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : 'Erreur inconnue');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (q: Question) => {
    try {
      const res = await apiFetch(`/api/admin/questions/${q.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actif: !q.actif }),
      });
      if (res.ok) loadQuestions();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      const res = await apiFetch(`/api/admin/questions/${confirmDelete.id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Erreur');
      // Info: soft delete if used in responses
      if (data.softDeleted) {
        alert(data.message);
      }
      setConfirmDelete(null);
      loadQuestions();
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
            <FileQuestion className="w-4 h-4" style={{ color: COLORS.green }} />
            Banque de questions
            <Badge variant="outline" className="ml-2 text-[10px]">{total} question{total !== 1 ? 's' : ''}</Badge>
          </CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                className="h-7 text-xs border border-gray-300 rounded-md pl-8 pr-3 bg-white w-44"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <select
              className="h-7 text-xs border border-gray-300 rounded-md px-2 bg-white"
              value={filterCat}
              onChange={e => { setFilterCat(e.target.value); setPage(1); }}
            >
              <option value="">Toutes catégories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              className="h-7 text-xs border border-gray-300 rounded-md px-2 bg-white"
              value={filterDiff}
              onChange={e => { setFilterDiff(e.target.value); setPage(1); }}
            >
              <option value="">Toutes difficultés</option>
              {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select
              className="h-7 text-xs border border-gray-300 rounded-md px-2 bg-white"
              value={filterMedia}
              onChange={e => { setFilterMedia(e.target.value); setPage(1); }}
            >
              <option value="">Tous types</option>
              {MEDIA_TYPES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            <Button size="sm" className="h-7 text-xs gap-1" style={{ background: COLORS.green, color: 'white' }} onClick={openCreate}>
              <Plus className="w-3 h-3" />
              Nouvelle question
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="py-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto" style={{ color: COLORS.green }} />
          </div>
        ) : questions.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <FileQuestion className="w-10 h-10 mx-auto mb-2" />
            <p className="text-sm">Aucune question trouvée</p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="border-b" style={{ borderColor: '#E5E7EB' }}>
                  <th className="text-left py-2 px-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Question</th>
                  <th className="text-center py-2 px-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Catégorie</th>
                  <th className="text-center py-2 px-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Difficulté</th>
                  <th className="text-center py-2 px-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Type</th>
                  <th className="text-center py-2 px-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Statut</th>
                  <th className="text-center py-2 px-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((q) => (
                  <tr key={q.id} className="border-b last:border-0 hover:bg-gray-50/50" style={{ borderColor: '#F3F4F6' }}>
                    <td className="py-2.5 px-3 max-w-md">
                      <div className="flex items-start gap-2">
                        <span className="text-[10px] font-mono text-gray-400 mt-0.5">#{q.id}</span>
                        <p className="text-xs line-clamp-2" style={{ color: COLORS.primaryDark }}>{q.texte}</p>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <Badge variant="outline" className="text-[10px]">{q.categorie}</Badge>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <Badge className={`text-[10px] ${
                        q.difficulte === 'facile' ? 'bg-green-50 text-green-700' :
                        q.difficulte === 'moyen' ? 'bg-yellow-50 text-yellow-700' :
                        'bg-red-50 text-red-700'
                      }`}>{q.difficulte}</Badge>
                    </td>
                    <td className="py-2.5 px-3 text-center text-[10px]" style={{ color: '#6B7280' }}>
                      {MEDIA_TYPES.find(m => m.value === q.mediaType)?.label || q.mediaType}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {q.actif ? (
                        <Badge className="text-[10px] bg-green-50 text-green-700">Active</Badge>
                      ) : (
                        <Badge className="text-[10px] bg-gray-100 text-gray-600">Inactive</Badge>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => openEdit(q)} title="Modifier">
                          <Pencil className="w-3 h-3" style={{ color: COLORS.green }} />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => toggleActive(q)} title={q.actif ? 'Désactiver' : 'Activer'}>
                          {q.actif ? <ToggleRight className="w-4 h-4 text-green-600" /> : <ToggleLeft className="w-4 h-4 text-gray-400" />}
                        </Button>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setConfirmDelete(q)} title="Supprimer">
                          <Trash2 className="w-3 h-3" style={{ color: COLORS.red }} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 px-2">
                <p className="text-[10px] text-gray-500">Page {page} / {totalPages}</p>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)} className="h-7 text-xs">Précédent</Button>
                  <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="h-7 text-xs">Suivant</Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* ─── Create/Edit Modal ─── */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold" style={{ color: COLORS.primaryDark }}>
                {editingId ? `Modifier la question #${editingId}` : 'Nouvelle question'}
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)} className="h-7 w-7 p-0">
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                  {formError}
                </div>
              )}
              <div>
                <label className="block text-[11px] font-semibold mb-1" style={{ color: COLORS.primaryDark }}>Texte de la question *</label>
                <textarea
                  className="w-full text-xs border border-gray-300 rounded-md p-2 min-h-[80px]"
                  value={form.texte}
                  onChange={e => setForm({ ...form, texte: e.target.value })}
                  placeholder="Ex: Que signifie ce panneau ?"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold mb-1" style={{ color: COLORS.primaryDark }}>Options de réponse *</label>
                <p className="text-[10px] text-gray-500 mb-2">Cochez la bonne réponse. Au moins 2 options requises.</p>
                <div className="space-y-2">
                  {form.options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="bonneReponse"
                        checked={form.bonneReponse === i}
                        onChange={() => setForm({ ...form, bonneReponse: i })}
                        className="w-4 h-4"
                      />
                      <input
                        type="text"
                        className="flex-1 text-xs border border-gray-300 rounded-md px-2 py-1.5"
                        value={opt}
                        onChange={e => {
                          const newOptions = [...form.options];
                          newOptions[i] = e.target.value;
                          setForm({ ...form, options: newOptions });
                        }}
                        placeholder={`Option ${i + 1}`}
                      />
                      {form.options.length > 2 && (
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => {
                          const newOptions = form.options.filter((_, idx) => idx !== i);
                          const newBonne = form.bonneReponse >= i ? Math.max(0, form.bonneReponse - 1) : form.bonneReponse;
                          setForm({ ...form, options: newOptions, bonneReponse: newBonne });
                        }}>
                          <X className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {form.options.length < 6 && (
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setForm({ ...form, options: [...form.options, ''] })}>
                      <Plus className="w-3 h-3 mr-1" /> Ajouter une option
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold mb-1" style={{ color: COLORS.primaryDark }}>Catégorie *</label>
                  <select
                    className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5"
                    value={form.categorie}
                    onChange={e => setForm({ ...form, categorie: e.target.value })}
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold mb-1" style={{ color: COLORS.primaryDark }}>Difficulté</label>
                  <select
                    className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5"
                    value={form.difficulte}
                    onChange={e => setForm({ ...form, difficulte: e.target.value })}
                  >
                    {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold mb-1" style={{ color: COLORS.primaryDark }}>Type de média</label>
                  <select
                    className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5"
                    value={form.mediaType}
                    onChange={e => setForm({ ...form, mediaType: e.target.value })}
                  >
                    {MEDIA_TYPES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold mb-1" style={{ color: COLORS.primaryDark }}>Points</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5"
                    value={form.points}
                    onChange={e => setForm({ ...form, points: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold mb-1" style={{ color: COLORS.primaryDark }}>Temps estimé (s)</label>
                  <input
                    type="number"
                    min={5}
                    max={120}
                    className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5"
                    value={form.tempsEstime}
                    onChange={e => setForm({ ...form, tempsEstime: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold mb-1" style={{ color: COLORS.primaryDark }}>Tags (séparés par virgules)</label>
                  <input
                    type="text"
                    className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5"
                    value={form.tagsInput}
                    onChange={e => setForm({ ...form, tagsInput: e.target.value })}
                    placeholder="Ex: ville, priorité, panneau"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold mb-1" style={{ color: COLORS.primaryDark }}>Explication *</label>
                <textarea
                  className="w-full text-xs border border-gray-300 rounded-md p-2 min-h-[60px]"
                  value={form.explication}
                  onChange={e => setForm({ ...form, explication: e.target.value })}
                  placeholder="Explication affichée après la réponse"
                />
              </div>
            </div>
            <div className="sticky bottom-0 bg-white border-t px-6 py-3 flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setModalOpen(false)} className="text-xs">Annuler</Button>
              <Button size="sm" onClick={handleSave} disabled={saving} className="text-xs gap-1" style={{ background: COLORS.green, color: 'white' }}>
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                {editingId ? 'Enregistrer' : 'Créer'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Confirm delete modal ─── */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                <Trash2 className="w-5 h-5" style={{ color: COLORS.red }} />
              </div>
              <h3 className="text-sm font-semibold" style={{ color: COLORS.primaryDark }}>Supprimer la question ?</h3>
            </div>
            <p className="text-xs text-gray-600 mb-4">
              Voulez-vous vraiment supprimer la question <span className="font-mono">#{confirmDelete.id}</span> ?
              Si elle est utilisée dans des réponses d'examen, elle sera désactivée au lieu d'être supprimée.
            </p>
            <p className="text-[11px] text-gray-500 italic mb-4 line-clamp-2">{confirmDelete.texte}</p>
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
