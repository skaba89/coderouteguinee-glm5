'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { X, Save, Loader2, UserPlus, Info } from 'lucide-react';

const COLORS = {
  primaryDark: '#1A2332',
  red: '#CE1126',
  yellow: '#FCD116',
  green: '#009460',
};

const REGIONS = ['Conakry', 'Boké', 'Faranah', 'Kankan', 'Kindia', 'Labé', 'Mamou', 'Nzérékoré'];

const ROLES = [
  { value: 'candidat', label: 'Candidat' },
  { value: 'auto-ecole', label: 'Auto-école' },
  { value: 'centre-agree', label: 'Centre agréé' },
  { value: 'administration', label: 'Administration' },
];

interface FormState {
  email: string;
  password: string;
  nom: string;
  prenom: string;
  telephone: string;
  dateNaissance: string;
  numeroIdentite: string;
  ville: string;
  region: string;
  categoriePermis: string;
  role: string;
}

const emptyForm: FormState = {
  email: '',
  password: '',
  nom: '',
  prenom: '',
  telephone: '',
  dateNaissance: '',
  numeroIdentite: '',
  ville: 'Conakry',
  region: 'Conakry',
  categoriePermis: 'B',
  role: 'candidat',
};

export function CreateUserModal({
  open,
  onClose,
  onCreated,
  canCreateAdmin,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  canCreateAdmin: boolean;
}) {
  const { apiFetch } = useAuth();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!open) return null;

  const reset = () => {
    setForm(emptyForm);
    setError(null);
    setSuccess(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(null);
    if (!form.email.trim() || !form.password || !form.nom.trim() || !form.prenom.trim() || !form.telephone.trim()) {
      setError('Champs requis manquants: email, mot de passe, nom, prénom, téléphone');
      return;
    }
    if (form.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('Email invalide');
      return;
    }

    setSaving(true);
    try {
      const res = await apiFetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la création');
      }
      setSuccess(`Compte ${form.role} créé avec succès : ${data.user?.numeroUnique || ''} (${data.user?.email})`);
      setForm(emptyForm);
      onCreated();
      // Auto-close after 2s
      setTimeout(() => {
        setSuccess(null);
        handleClose();
      }, 2000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue');
    } finally {
      setSaving(false);
    }
  };

  const availableRoles = canCreateAdmin ? ROLES : ROLES.filter(r => r.value !== 'administration');

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: COLORS.primaryDark }}>
            <UserPlus className="w-4 h-4" style={{ color: COLORS.green }} />
            Créer un nouveau compte
          </h3>
          <Button variant="ghost" size="sm" onClick={handleClose} className="h-7 w-7 p-0"><X className="w-4 h-4" /></Button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700">{error}</div>
          )}
          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded text-xs text-green-700">{success}</div>
          )}

          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: COLORS.primaryDark }}>Rôle du compte *</label>
            <select
              className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5"
              value={form.role}
              onChange={e => setForm({ ...form, role: e.target.value })}
            >
              {availableRoles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            <p className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
              <Info className="w-3 h-3" />
              {form.role === 'candidat' && 'Le candidat pourra s\'inscrire aux examens et passer des tests.'}
              {form.role === 'auto-ecole' && 'L\'auto-école pourra gérer ses étudiants et voir ses statistiques.'}
              {form.role === 'centre-agree' && 'Le centre agréé pourra gérer les réservations et le planning des examens.'}
              {form.role === 'administration' && 'L\'administration aura accès au dashboard admin (sans journal d\'audit ni système).'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold mb-1" style={{ color: COLORS.primaryDark }}>Prénom *</label>
              <input type="text" className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5" value={form.prenom} onChange={e => setForm({ ...form, prenom: e.target.value })} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1" style={{ color: COLORS.primaryDark }}>Nom *</label>
              <input type="text" className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1" style={{ color: COLORS.primaryDark }}>Email *</label>
              <input type="email" className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1" style={{ color: COLORS.primaryDark }}>Téléphone *</label>
              <input type="tel" className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5" placeholder="622 XXX XXX" value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1" style={{ color: COLORS.primaryDark }}>Mot de passe *</label>
              <input type="text" className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 font-mono" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Min. 8 caractères" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1" style={{ color: COLORS.primaryDark }}>Date de naissance</label>
              <input type="date" className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5" value={form.dateNaissance} onChange={e => setForm({ ...form, dateNaissance: e.target.value })} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1" style={{ color: COLORS.primaryDark }}>N° d'identité</label>
              <input type="text" className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5" value={form.numeroIdentite} onChange={e => setForm({ ...form, numeroIdentite: e.target.value })} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1" style={{ color: COLORS.primaryDark }}>Région</label>
              <select className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5" value={form.region} onChange={e => setForm({ ...form, region: e.target.value, ville: e.target.value })}>
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1" style={{ color: COLORS.primaryDark }}>Ville</label>
              <input type="text" className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5" value={form.ville} onChange={e => setForm({ ...form, ville: e.target.value })} />
            </div>
            {form.role === 'candidat' && (
              <div>
                <label className="block text-[11px] font-semibold mb-1" style={{ color: COLORS.primaryDark }}>Catégorie de permis</label>
                <select className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5" value={form.categoriePermis} onChange={e => setForm({ ...form, categoriePermis: e.target.value })}>
                  <option value="A">A (Moto)</option>
                  <option value="B">B (Voiture)</option>
                  <option value="C">C (Poids lourd)</option>
                  <option value="D">D (Transport public)</option>
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t px-6 py-3 flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={handleClose} className="text-xs">Annuler</Button>
          <Button size="sm" onClick={handleSave} disabled={saving} className="text-xs gap-1" style={{ background: COLORS.green, color: 'white' }}>
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            Créer le compte
          </Button>
        </div>
      </div>
    </div>
  );
}
