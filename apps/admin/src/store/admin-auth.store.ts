import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { AuthResponse, User } from '@community-marketplace/types';

import { clearAdminRoleCookie, setAdminRoleCookie } from '@/lib/role-cookie';

interface AuthSession {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  expiresIn: number;
  issuedAt: string;
}

interface AdminAuthState {
  user: User | null;
  session: AuthSession | null;
  setAuth: (response: AuthResponse) => void;
  clearUser: () => void;
}

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      setAuth: (response) => {
        setAdminRoleCookie(response.user.role);
        set({
          user: response.user,
          session: {
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            sessionId: response.sessionId,
            expiresIn: response.expiresIn,
            issuedAt: response.issuedAt,
          },
        });
      },
      clearUser: () => {
        clearAdminRoleCookie();
        set({ user: null, session: null });
      },
    }),
    { name: 'cm-admin-auth' },
  ),
);

export function getStoredAdminAccessToken(): string | null {
  const raw = localStorage.getItem('cm-admin-auth');
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { state?: { session?: AuthSession | null } };
    return parsed.state?.session?.accessToken ?? null;
  } catch {
    return null;
  }
}
