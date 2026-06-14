'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { User, UserRole, NationalLanguage } from './types';

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  mounted: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: Omit<User, 'id' | 'numeroUnique'> & { password?: string }) => Promise<boolean>;
  logout: () => void;
  loginAsAdmin: (email: string, password: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Map API user response to our User type
function mapApiUser(apiUser: Record<string, unknown>): User {
  return {
    id: apiUser.id as string,
    nom: apiUser.nom as string,
    prenom: apiUser.prenom as string,
    dateNaissance: apiUser.dateNaissance as string,
    numeroIdentite: apiUser.numeroIdentite as string,
    telephone: apiUser.telephone as string,
    email: apiUser.email as string,
    ville: apiUser.ville as string,
    region: apiUser.region as string,
    categoriePermis: apiUser.categoriePermis as string,
    role: apiUser.role as UserRole,
    numeroUnique: apiUser.numeroUnique as string,
    langueMaternelle: (apiUser.langueMaternelle as NationalLanguage) || 'fr',
    photo: apiUser.photo as string | undefined,
    createdAt: apiUser.createdAt as string | undefined,
    lastLogin: apiUser.updatedAt as string | undefined,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const isLoggedIn = user !== null;

  // Hydrate user from session cookie on mount
  useEffect(() => {
    async function restoreSession() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUser(mapApiUser(data.user));
            // Also store in localStorage for quick access
            localStorage.setItem('coderoute_user', JSON.stringify(data.user));
          }
        } else {
          // Session invalid or expired — clear localStorage
          localStorage.removeItem('coderoute_user');
        }
      } catch {
        // Network error — try localStorage fallback
        try {
          const stored = localStorage.getItem('coderoute_user');
          if (stored) {
            const parsed = JSON.parse(stored);
            setUser(mapApiUser(parsed));
          }
        } catch {
          localStorage.removeItem('coderoute_user');
        }
      }
      setMounted(true);
    }
    restoreSession();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.error('Login failed:', data.error);
        return false;
      }

      const data = await res.json();
      const mappedUser = mapApiUser(data.user);
      setUser(mappedUser);
      localStorage.setItem('coderoute_user', JSON.stringify(data.user));
      return true;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (userData: Omit<User, 'id' | 'numeroUnique'> & { password?: string }): Promise<boolean> => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.error('Registration failed:', data.error);
        return false;
      }

      const data = await res.json();
      const mappedUser = mapApiUser(data.user);
      setUser(mappedUser);
      localStorage.setItem('coderoute_user', JSON.stringify(data.user));
      return true;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    localStorage.removeItem('coderoute_user');
    // Also invalidate server session
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore errors on logout
    }
  }, []);

  const loginAsAdmin = useCallback(async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        return false;
      }

      const data = await res.json();
      const mappedUser = mapApiUser(data.user);

      // Verify admin role
      if (mappedUser.role !== 'administration' && mappedUser.role !== 'super-admin') {
        // Not an admin — logout immediately
        try {
          await fetch('/api/auth/logout', { method: 'POST' });
        } catch { /* ignore */ }
        return false;
      }

      setUser(mappedUser);
      localStorage.setItem('coderoute_user', JSON.stringify(data.user));
      return true;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, mounted, loading, login, register, logout, loginAsAdmin }}>
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
