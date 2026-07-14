import type { LoginResponse } from '@community-marketplace/types';

import { API_BASE_URL } from '@/lib/constants';
import { WEB_API_ROUTES } from '@/lib/api-routes';
import {
  getStoredAccessToken,
  getStoredRefreshToken,
  useAuthStore,
} from '@/store/auth.store';

export function resolveClientAccessToken(explicit?: string | null): string | null {
  if (explicit) return explicit;
  return getStoredAccessToken();
}

export function resolveClientRefreshToken(): string | null {
  return getStoredRefreshToken();
}

async function requestSessionRefresh(body: Record<string, unknown>): Promise<LoginResponse | null> {
  const response = await fetch(`${API_BASE_URL}${WEB_API_ROUTES.public.auth.refresh}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  if (!response.ok) return null;

  const json = (await response.json()) as { data?: LoginResponse };
  const session = json.data;
  if (!session?.accessToken || !session.refreshToken || !session.user) return null;

  useAuthStore.getState().setAuth(session);
  return session;
}

/** Refresh session; returns new access token or null. */
export async function refreshClientSession(): Promise<string | null> {
  const session = await reloadAuthenticatedSession();
  return session?.accessToken ?? null;
}

/** Refresh tokens and sync the authenticated user in client state. */
export async function reloadAuthenticatedSession(): Promise<LoginResponse | null> {
  const refreshToken = resolveClientRefreshToken();
  if (refreshToken) {
    const fromStorage = await requestSessionRefresh({ refreshToken });
    if (fromStorage) return fromStorage;
  }

  // Stale localStorage token can block the API from using the httpOnly cookie.
  return requestSessionRefresh({});
}
