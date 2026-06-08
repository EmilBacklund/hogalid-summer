'use client';

import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useMe } from '@/hooks/useMe';
import { apiPost } from '@/utils/api';
import { exitDemo, isDemoActive } from '@/demo/demoMode';
import type { User } from '@/types';

interface UserContextValue {
  /** The signed-in player, or null when unauthenticated / admin. */
  user: User | null;
  isAdmin: boolean;
  /** A coach account: moderates (e.g. approves photos) but does not play. */
  isLeader: boolean;
  /** True while exploring the read-only demo (no real account, nothing saved). */
  isDemo: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** Re-fetch the current session user (e.g. after a mutation). */
  refresh: () => Promise<void>;
  /** Clear the session cookie + query cache and go to /login. */
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | null>(null);

/**
 * Session state, sourced from the httpOnly cookie via `/api/auth/me` (no
 * localStorage — that was the old XSS-exposed scheme). Typed rebuild of the
 * legacy `UserContext.jsx`; game-action handlers return with their screens.
 */
export function UserProvider({ children }: { children: ReactNode }) {
  const { data, isLoading, isError } = useMe();
  const queryClient = useQueryClient();
  const router = useRouter();

  const isAdmin = !!data && 'isAdmin' in data && data.isAdmin === true;
  const user = data && 'logs' in data ? data : null;
  const isLeader = user?.role === 'leader';
  // Demo is active only when the per-tab flag is set AND the session resolved to
  // the demo fixture — both must agree, so a stale flag can't masquerade.
  const isDemo = isDemoActive() && user?.alias === 'demo';
  const isAuthenticated = !!data && !isError;

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['me'] });
  }, [queryClient]);

  const logout = useCallback(async () => {
    const wasDemo = isDemoActive();
    // Always drop demo state first; in demo there is no real session to clear.
    exitDemo();
    try {
      // In demo there is no server session — skip the network call entirely.
      if (!wasDemo) await apiPost('/auth/logout', {});
    } catch {
      // Best-effort — clear locally regardless.
    }
    queryClient.clear();
    router.push('/login');
    router.refresh();
  }, [queryClient, router]);

  const value = useMemo<UserContextValue>(
    () => ({ user, isAdmin, isLeader, isDemo, isAuthenticated, isLoading, refresh, logout }),
    [user, isAdmin, isLeader, isDemo, isAuthenticated, isLoading, refresh, logout],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within <UserProvider>');
  return ctx;
}
