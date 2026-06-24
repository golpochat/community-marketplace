import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { AuthResponse, PermissionCode, User } from '@community-marketplace/types';

import { clearAdminRoleCookie, clearAdminAuthTokenCookie, setAdminAuthTokenCookie, setAdminRoleCookie } from '@/lib/role-cookie';

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
  permissions: PermissionCode[];
  setAuth: (response: AuthResponse) => void;
  setPermissions: (permissions: PermissionCode[]) => void;
  clearUser: () => void;
}

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      permissions: [],
      setAuth: (response) => {
        setAdminRoleCookie(response.user.role);
        setAdminAuthTokenCookie(response.accessToken);
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
      setPermissions: (permissions) => set({ permissions }),
      clearUser: () => {
        clearAdminRoleCookie();
        clearAdminAuthTokenCookie();
        set({ user: null, session: null, permissions: [] });
      },
    }),
    { name: 'cm-admin-auth' },
  ),
);

export function getStoredAdminAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('cm-admin-auth');
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { state?: { session?: AuthSession | null } };
    return parsed.state?.session?.accessToken ?? null;
  } catch {
    return null;
  }
}

export function getStoredAdminRole(): 'SUPER_ADMIN' | 'ADMIN' | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('cm-admin-auth');
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { state?: { user?: User | null } };
    const role = parsed.state?.user?.role;
    return role === 'SUPER_ADMIN' || role === 'ADMIN' ? role : null;
  } catch {
    return null;
  }
}
