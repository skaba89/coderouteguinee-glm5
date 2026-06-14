'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/lib/auth-context';
import { categoriesPermis } from '@/lib/mock-data';
import { UserRole } from '@/lib/types';
import { Car, Mail, Lock, User, Phone, MapPin, CreditCard, Shield } from 'lucide-react';

interface AuthModalsProps {
  loginOpen: boolean;
  registerOpen: boolean;
  onCloseLogin: () => void;
  onCloseRegister: () => void;
  onSwitchToRegister: () => void;
  onSwitchToLogin: () => void;
  onAuthSuccess: () => void;
}

export default function AuthModals({
  loginOpen,
  registerOpen,
  onCloseLogin,
  onCloseRegister,
  onSwitchToRegister,
  onSwitchToLogin,
  onAuthSuccess,
}: AuthModalsProps) {
  const { login, register, loginAsAdmin } = useAuth();

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Register state
  const [regNom, setRegNom] = useState('');
  const [regPrenom, setRegPrenom] = useState('');
  const [regDateNaissance, setRegDateNaissance] = useState('');
  const [regNumeroIdentite, setRegNumeroIdentite] = useState('');
  const [regTelephone, setRegTelephone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regVille, setRegVille] = useState('');
  const [regCategorie, setRegCategorie] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('candidat');
  const [regPassword, setRegPassword] = useState('');
  const [regError, setRegError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!loginEmail || !loginPassword) {
      setLoginError('Veuillez remplir tous les champs');
      return;
    }
    const success = login(loginEmail, loginPassword);
    if (success) {
      onCloseLogin();
      setLoginEmail('');
      setLoginPassword('');
      onAuthSuccess();
    } else {
      setLoginError('Identifiants incorrects');
    }
  };

  const handleAdminLogin = () => {
    loginAsAdmin();
    onCloseLogin();
    onAuthSuccess();
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (!regNom || !regPrenom || !regDateNaissance || !regNumeroIdentite || !regTelephone || !regEmail || !regVille || !regCategorie) {
      setRegError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const success = register({
      nom: regNom,
      prenom: regPrenom,
      dateNaissance: regDateNaissance,
      numeroIdentite: regNumeroIdentite,
      telephone: regTelephone,
      email: regEmail,
      ville: regVille,
      region: regVille, // Using ville as region for now
      categoriePermis: regCategorie,
      role: regRole,
      langueMaternelle: 'fr',
    });

    if (success) {
      onCloseRegister();
      setRegNom(''); setRegPrenom(''); setRegDateNaissance(''); setRegNumeroIdentite('');
      setRegTelephone(''); setRegEmail(''); setRegVille(''); setRegCategorie(''); setRegPassword('');
      onAuthSuccess();
    } else {
      setRegError('Un compte avec cet email existe déjà');
    }
  };

  return (
    <>
      {/* Login Modal */}
      <Dialog open={loginOpen} onOpenChange={onCloseLogin}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#009460' }}>
                <Car className="w-6 h-6 text-white" />
              </div>
              <DialogTitle className="text-xl" style={{ color: '#1A2332' }}>
                Connexion
              </DialogTitle>
            </div>
            <DialogDescription>
              Connectez-vous à votre espace CodeRoute Guinée
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="login-email"
                  type="email"
                  placeholder="votre@email.gn"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password">Mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {loginError && (
              <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{loginError}</p>
            )}

            <Button type="submit" className="w-full text-white font-semibold" style={{ backgroundColor: '#009460' }}>
              Se connecter
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-400">ou</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full font-semibold"
              onClick={handleAdminLogin}
            >
              <Shield className="w-4 h-4 mr-2" />
              Connexion Administration
            </Button>

            <p className="text-center text-sm text-gray-500">
              Pas encore de compte ?{' '}
              <button
                type="button"
                className="font-semibold hover:underline"
                style={{ color: '#009460' }}
                onClick={onSwitchToRegister}
              >
                S&apos;inscrire
              </button>
            </p>
          </form>
        </DialogContent>
      </Dialog>

      {/* Register Modal */}
      <Dialog open={registerOpen} onOpenChange={onCloseRegister}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#009460' }}>
                <User className="w-6 h-6 text-white" />
              </div>
              <DialogTitle className="text-xl" style={{ color: '#1A2332' }}>
                Inscription
              </DialogTitle>
            </div>
            <DialogDescription>
              Créez votre compte pour passer l&apos;examen du code de la route
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRegister} className="space-y-4">
            <Tabs defaultValue="identity" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="identity" className="flex-1">Identité</TabsTrigger>
                <TabsTrigger value="contact" className="flex-1">Contact</TabsTrigger>
                <TabsTrigger value="permis" className="flex-1">Permis</TabsTrigger>
              </TabsList>

              <TabsContent value="identity" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="reg-nom">Nom *</Label>
                    <Input id="reg-nom" placeholder="Diallo" value={regNom} onChange={e => setRegNom(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-prenom">Prénom *</Label>
                    <Input id="reg-prenom" placeholder="Mamadou" value={regPrenom} onChange={e => setRegPrenom(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-dob">Date de naissance *</Label>
                  <Input id="reg-dob" type="date" value={regDateNaissance} onChange={e => setRegDateNaissance(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-id">Numéro d&apos;identité *</Label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input id="reg-id" placeholder="GN-12345678" value={regNumeroIdentite} onChange={e => setRegNumeroIdentite(e.target.value)} className="pl-10" />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="contact" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="reg-tel">Téléphone *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input id="reg-tel" placeholder="+224 622 00 00 00" value={regTelephone} onChange={e => setRegTelephone(e.target.value)} className="pl-10" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-email">Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input id="reg-email" type="email" placeholder="votre@email.gn" value={regEmail} onChange={e => setRegEmail(e.target.value)} className="pl-10" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-ville">Ville *</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input id="reg-ville" placeholder="Conakry" value={regVille} onChange={e => setRegVille(e.target.value)} className="pl-10" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password">Mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input id="reg-password" type="password" placeholder="••••••••" value={regPassword} onChange={e => setRegPassword(e.target.value)} className="pl-10" />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="permis" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Catégorie de permis *</Label>
                  <Select value={regCategorie} onValueChange={setRegCategorie}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoriesPermis.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Vous êtes *</Label>
                  <Select value={regRole} onValueChange={(val) => setRegRole(val as UserRole)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir votre profil" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="candidat">Candidat</SelectItem>
                      <SelectItem value="auto-ecole">Auto-école</SelectItem>
                      <SelectItem value="centre-agree">Centre agréé</SelectItem>
                      <SelectItem value="administration">Administration</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
            </Tabs>

            {regError && (
              <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{regError}</p>
            )}

            <Button type="submit" className="w-full text-white font-semibold" style={{ backgroundColor: '#009460' }}>
              Créer mon compte
            </Button>

            <p className="text-center text-sm text-gray-500">
              Déjà inscrit ?{' '}
              <button
                type="button"
                className="font-semibold hover:underline"
                style={{ color: '#009460' }}
                onClick={onSwitchToLogin}
              >
                Se connecter
              </button>
            </p>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
