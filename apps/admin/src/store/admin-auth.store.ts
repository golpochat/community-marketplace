import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { AuthResponse, PermissionCode, User } from '@community-marketplace/types';

import { clearAdminRoleCookie, clearAdminAuthTokenCookie, clearAdminRefreshTokenCookie, setAdminAuthTokenCookie, setAdminRefreshTokenCookie, setAdminRoleCookie } from '@/lib/role-cookie';

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
  updateSessionTokens: (accessToken: string, refreshToken: string) => void;
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
        setAdminRefreshTokenCookie(response.refreshToken);
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
      updateSessionTokens: (accessToken, refreshToken) => {
        setAdminAuthTokenCookie(accessToken);
        setAdminRefreshTokenCookie(refreshToken);
        set((state) => ({
          session: state.session
            ? { ...state.session, accessToken, refreshToken }
            : null,
        }));
      },
      clearUser: () => {
        clearAdminRoleCookie();
        clearAdminAuthTokenCookie();
        clearAdminRefreshTokenCookie();
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

export function getStoredAdminRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('cm-admin-auth');
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { state?: { session?: AuthSession | null } };
    return parsed.state?.session?.refreshToken ?? null;
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
