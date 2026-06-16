'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { User, UserRole, NationalLanguage } from './types';

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  mounted: boolean;
  loading: boolean;
  csrfToken: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: Omit<User, 'id' | 'numeroUnique'> & { password?: string }) => Promise<boolean>;
  logout: () => void;
  loginAsAdmin: (email: string, password: string) => Promise<boolean>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
  confirmPasswordReset: (token: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  apiFetch: (url: string, options?: RequestInit) => Promise<Response>;
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
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const csrfFetchPromise = useRef<Promise<void> | null>(null);

  const isLoggedIn = user !== null;

  // Fetch CSRF token
  const fetchCsrfToken = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/csrf');
      if (res.ok) {
        const data = await res.json();
        setCsrfToken(data.csrfToken);
      }
    } catch {
      // CSRF token fetch failed — will retry on next request
    }
  }, []);

  // Hydrate user from session cookie on mount
  useEffect(() => {
    async function restoreSession() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUser(mapApiUser(data.user));
            localStorage.setItem('coderoute_user', JSON.stringify(data.user));
          }
        } else {
          localStorage.removeItem('coderoute_user');
        }
      } catch {
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
    // Fetch CSRF token after mounting
    fetchCsrfToken();
  }, [fetchCsrfToken]);

  // Ensure CSRF token is fetched before state-changing requests
  const ensureCsrf = useCallback(async () => {
    if (csrfToken) return;
    if (!csrfFetchPromise.current) {
      csrfFetchPromise.current = fetchCsrfToken();
    }
    await csrfFetchPromise.current;
    csrfFetchPromise.current = null;
  }, [csrfToken, fetchCsrfToken]);

  // ─── Secure API fetch with CSRF token ─────────────────────
  const apiFetch = useCallback(async (url: string, options: RequestInit = {}): Promise<Response> => {
    const method = (options.method || 'GET').toUpperCase();
    const isStateChanging = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

    // Skip CSRF for login/register/logout (no session cookie yet for first two)
    const skipCsrf = url === '/api/auth/login' ||
                     url === '/api/auth/register' ||
                     url === '/api/auth/logout' ||
                     url === '/api/auth/reset-password';

    if (isStateChanging && !skipCsrf) {
      await ensureCsrf();
      const headers = new Headers(options.headers || {});
      if (csrfToken) {
        headers.set('x-csrf-token', csrfToken);
      }
      options.headers = headers;
    }

    const response = await fetch(url, options);

    // If CSRF token expired (403), refresh and retry once
    if (response.status === 403 && isStateChanging && !skipCsrf) {
      const data = await response.json().catch(() => ({}));
      if (data.error?.includes('CSRF')) {
        await fetchCsrfToken();
        if (csrfToken) {
          const headers = new Headers(options.headers || {});
          headers.set('x-csrf-token', csrfToken);
          options.headers = headers;
          return fetch(url, options);
        }
      }
    }

    return response;
  }, [csrfToken, ensureCsrf, fetchCsrfToken]);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
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
      setUser(mappedUser);
      localStorage.setItem('coderoute_user', JSON.stringify(data.user));
      // Fetch CSRF token after login
      fetchCsrfToken();
      return true;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchCsrfToken]);

  const register = useCallback(async (userData: Omit<User, 'id' | 'numeroUnique'> & { password?: string }): Promise<boolean> => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      if (!res.ok) {
        return false;
      }

      const data = await res.json();
      const mappedUser = mapApiUser(data.user);
      setUser(mappedUser);
      localStorage.setItem('coderoute_user', JSON.stringify(data.user));
      fetchCsrfToken();
      return true;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchCsrfToken]);

  const logout = useCallback(async () => {
    setUser(null);
    setCsrfToken(null);
    localStorage.removeItem('coderoute_user');
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

      if (mappedUser.role !== 'administration' && mappedUser.role !== 'super-admin' && mappedUser.role !== 'centre-agree') {
        try {
          await fetch('/api/auth/logout', { method: 'POST' });
        } catch { /* ignore */ }
        return false;
      }

      setUser(mappedUser);
      localStorage.setItem('coderoute_user', JSON.stringify(data.user));
      fetchCsrfToken();
      return true;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchCsrfToken]);

  // ─── Password reset request ───────────────────────────────
  const requestPasswordReset = useCallback(async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Erreur lors de la demande de réinitialisation.' };
      }
      return { success: true };
    } catch {
      return { success: false, error: 'Erreur de connexion.' };
    }
  }, []);

  // ─── Password reset confirmation ──────────────────────────
  const confirmPasswordReset = useCallback(async (token: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Erreur lors de la réinitialisation.' };
      }
      return { success: true };
    } catch {
      return { success: false, error: 'Erreur de connexion.' };
    }
  }, []);

  // ─── Change password (authenticated) ──────────────────────
  const changePassword = useCallback(async (currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await apiFetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Erreur lors du changement de mot de passe.' };
      }
      return { success: true };
    } catch {
      return { success: false, error: 'Erreur de connexion.' };
    }
  }, [apiFetch]);

  return (
    <AuthContext.Provider value={{
      user, isLoggedIn, mounted, loading, csrfToken,
      login, register, logout, loginAsAdmin,
      requestPasswordReset, confirmPasswordReset, changePassword,
      apiFetch,
    }}>
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
