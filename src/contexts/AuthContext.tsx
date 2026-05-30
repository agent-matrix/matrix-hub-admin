import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';

export interface AuthUser {
  id?: string;
  username: string; // display handle (name or email local-part) — used by the sidebar
  email: string;
  name?: string | null;
  tenantId?: string | null;
  tenantName?: string | null;
  role?: string | null;
}

export interface AuthResult {
  ok: boolean;
  error?: string;
  /** Machine-readable code, e.g. "email_unverified", for tailored UI. */
  code?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (params: {
    email: string;
    password: string;
    fullName?: string;
    tenantName?: string;
  }) => Promise<AuthResult & { authenticated?: boolean; emailSkipped?: boolean }>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const LEGACY_KEY = 'matrix_hub_user';

function displayName(email: string, name?: string | null): string {
  if (name && name.trim()) return name.trim();
  return email.split('@')[0] || email;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Legacy fallback credentials (used only when no database is configured).
  const LEGACY_USER = process.env.NEXT_PUBLIC_ADMIN_USERNAME || 'admin';
  const LEGACY_PASS = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin';
  const LEGACY_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@matrixhub.io';

  // On mount: prefer a real server session, fall back to legacy local session.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch('/api/auth/me');
        if (r.ok) {
          const j = await r.json();
          if (!cancelled && j?.user) {
            setUser({
              id: j.user.id,
              email: j.user.email,
              username: displayName(j.user.email, j.user.fullName),
              name: j.user.fullName,
              tenantId: j.user.tenantId,
              role: j.user.role,
            });
            return;
          }
        }
      } catch {
        /* network/db unavailable — fall through to legacy */
      }
      if (!cancelled) {
        const stored = localStorage.getItem(LEGACY_KEY);
        if (stored) {
          try {
            setUser(JSON.parse(stored));
          } catch {
            localStorage.removeItem(LEGACY_KEY);
          }
        }
      }
    })().finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      try {
        const r = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        if (r.status === 503) {
          // No database configured → legacy admin/admin fallback.
          return legacyLogin(email, password);
        }

        const j = await r.json().catch(() => ({}));
        if (!r.ok) {
          return { ok: false, error: humanError(j?.error), code: j?.error };
        }
        setUser({
          id: j.user.id,
          email: j.user.email,
          username: displayName(j.user.email, j.user.fullName),
          name: j.user.fullName,
          tenantId: j.user.tenantId,
          tenantName: j.user.tenantName,
          role: j.user.role,
        });
        localStorage.removeItem(LEGACY_KEY);
        return { ok: true };
      } catch {
        // Server unreachable → still allow legacy fallback for offline/demo.
        return legacyLogin(email, password);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  function legacyLogin(emailOrUser: string, password: string): AuthResult {
    if ((emailOrUser === LEGACY_USER || emailOrUser === LEGACY_EMAIL) && password === LEGACY_PASS) {
      const u: AuthUser = { username: LEGACY_USER, email: LEGACY_EMAIL, role: 'owner' };
      setUser(u);
      localStorage.setItem(LEGACY_KEY, JSON.stringify(u));
      return { ok: true };
    }
    return { ok: false, error: 'Invalid credentials.', code: 'invalid_credentials' };
  }

  const register = useCallback(
    async (params: { email: string; password: string; fullName?: string; tenantName?: string }) => {
      try {
        const r = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        });
        const j = await r.json().catch(() => ({}));
        if (r.status === 503) {
          return { ok: false, error: 'User database is not configured on this deployment.', code: 'db_not_configured' };
        }
        if (!r.ok) return { ok: false, error: humanError(j?.error), code: j?.error };
        // First-run bootstrap signs the root in immediately.
        if (j?.authenticated && j?.user) {
          setUser({
            id: j.user.id,
            email: j.user.email,
            username: displayName(j.user.email, j.user.fullName),
            name: j.user.fullName,
            tenantId: j.user.tenantId,
            tenantName: j.user.tenantName,
            role: j.user.role,
          });
          localStorage.removeItem(LEGACY_KEY);
        }
        return { ok: true, authenticated: Boolean(j?.authenticated), emailSkipped: Boolean(j?.emailSkipped) };
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : 'Registration failed.' };
      }
    },
    []
  );

  const logout = useCallback(() => {
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    localStorage.removeItem(LEGACY_KEY);
    setUser(null);
    router.push('/login');
  }, [router]);

  if (loading) return null;

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, isAuthenticated: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
};

function humanError(code?: string): string {
  switch (code) {
    case 'invalid_credentials':
      return 'Invalid email or password.';
    case 'email_unverified':
      return 'Please verify your email before signing in.';
    case 'email_taken':
      return 'An account with that email already exists.';
    case 'weak_password':
      return 'Password must be at least 8 characters.';
    case 'invalid_email':
      return 'Enter a valid email address.';
    case 'account_disabled':
      return 'This account has been disabled.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
