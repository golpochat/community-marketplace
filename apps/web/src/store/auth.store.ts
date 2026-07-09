import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { AuthResponse, User } from '@community-marketplace/types';

import {
  clearWebAuthTokenCookie,
  clearWebRefreshTokenCookie,
  clearWebRoleCookie,
  setWebAuthTokenCookie,
  setWebRefreshTokenCookie,
  setWebRoleCookie,
} from '@/lib/role-cookie';

interface AuthSession {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  expiresIn: number;
  issuedAt: string;
}

interface AuthState {
  user: User | null;
  session: AuthSession | null;
  isAuthenticated: boolean;
  setAuth: (response: AuthResponse) => void;
  updateUser: (partial: Partial<User>) => void;
  updateSessionTokens: (accessToken: string, refreshToken: string) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      isAuthenticated: false,
      setAuth: (response) => {
        setWebRoleCookie(response.user.role);
        setWebAuthTokenCookie(response.accessToken);
        setWebRefreshTokenCookie(response.refreshToken);
        set({
          user: response.user,
          session: {
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            sessionId: response.sessionId,
            expiresIn: response.expiresIn,
            issuedAt: response.issuedAt,
          },
          isAuthenticated: true,
        });
      },
      updateUser: (partial) => {
        set((state) =>
          state.user ? { user: { ...state.user, ...partial } } : state,
        );
      },
      updateSessionTokens: (accessToken, refreshToken) => {
        setWebAuthTokenCookie(accessToken);
        setWebRefreshTokenCookie(refreshToken);
        set((state) => ({
          session: state.session
            ? { ...state.session, accessToken, refreshToken }
            : null,
        }));
      },
      clearUser: () => {
        clearWebRoleCookie();
        clearWebAuthTokenCookie();
        clearWebRefreshTokenCookie();
        set({ user: null, session: null, isAuthenticated: false });
      },
    }),
    { name: 'cm-auth' },
  ),
);

export function getStoredAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('cm-auth');
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { state?: { session?: AuthSession | null } };
    return parsed.state?.session?.accessToken ?? null;
  } catch {
    return null;
  }
}

export function getStoredRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('cm-auth');
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { state?: { session?: AuthSession | null } };
    return parsed.state?.session?.refreshToken ?? null;
  } catch {
    return null;
  }
}
