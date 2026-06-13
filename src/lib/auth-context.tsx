'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { User, UserRole, NationalLanguage } from './types';
import { generateCandidateNumber } from './mock-data';

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  mounted: boolean;
  login: (email: string, password: string) => boolean;
  register: (userData: Omit<User, 'id' | 'numeroUnique'>) => boolean;
  logout: () => void;
  loginAsAdmin: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);
  const isLoggedIn = user !== null;

  // Hydrate from localStorage after mount to avoid SSR mismatch
  useEffect(() => {
    try {
      const stored = localStorage.getItem('coderoute_user');
      if (stored) {
        // Use a microtask to avoid synchronous setState in effect
        queueMicrotask(() => setUser(JSON.parse(stored)));
      }
    } catch {
      localStorage.removeItem('coderoute_user');
    }
    queueMicrotask(() => setMounted(true));
  }, []);

  const login = useCallback((email: string, _password: string): boolean => {
    const stored = localStorage.getItem('coderoute_users');
    let users: User[] = stored ? JSON.parse(stored) : [];

    let found = users.find(u => u.email === email);

    if (!found) {
      found = {
        id: `USR-${Date.now()}`,
        nom: 'Diallo',
        prenom: 'Mamadou',
        dateNaissance: '1995-03-15',
        numeroIdentite: 'GN-12345678',
        telephone: '+224 622 00 00 00',
        email: email,
        ville: 'Conakry',
        region: 'Conakry',
        categoriePermis: 'B',
        role: 'candidat' as UserRole,
        numeroUnique: generateCandidateNumber(),
        langueMaternelle: 'fr' as NationalLanguage
      };
      users.push(found);
      localStorage.setItem('coderoute_users', JSON.stringify(users));
    }

    setUser(found);
    localStorage.setItem('coderoute_user', JSON.stringify(found));
    return true;
  }, []);

  const register = useCallback((userData: Omit<User, 'id' | 'numeroUnique'>): boolean => {
    const stored = localStorage.getItem('coderoute_users');
    let users: User[] = stored ? JSON.parse(stored) : [];

    const exists = users.find(u => u.email === userData.email);
    if (exists) return false;

    const newUser: User = {
      ...userData,
      id: `USR-${Date.now()}`,
      numeroUnique: generateCandidateNumber()
    };

    users.push(newUser);
    localStorage.setItem('coderoute_users', JSON.stringify(users));
    setUser(newUser);
    localStorage.setItem('coderoute_user', JSON.stringify(newUser));
    return true;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('coderoute_user');
  }, []);

  const loginAsAdmin = useCallback(() => {
    const adminUser: User = {
      id: 'USR-ADMIN',
      nom: 'Administrateur',
      prenom: 'Système',
      dateNaissance: '1980-01-01',
      numeroIdentite: 'GN-ADMIN-001',
      telephone: '+224 622 00 00 01',
      email: 'admin@coderoute.gn',
      ville: 'Conakry',
      region: 'Conakry',
      categoriePermis: 'B',
      role: 'administration' as UserRole,
      numeroUnique: 'GN-CODE-ADMIN-001',
      langueMaternelle: 'fr' as NationalLanguage
    };
    setUser(adminUser);
    localStorage.setItem('coderoute_user', JSON.stringify(adminUser));
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, mounted, login, register, logout, loginAsAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
