import { API_BASE_URL } from '@/lib/constants';
import {
  getAdminAuthTokenFromCookie,
  getAdminRefreshTokenFromCookie,
  setAdminAuthTokenCookie,
  setAdminRefreshTokenCookie,
} from '@/lib/role-cookie';
import {
  getStoredAdminAccessToken,
  getStoredAdminRefreshToken,
  useAdminAuthStore,
} from '@/store/admin-auth.store';

export function resolveClientAccessToken(explicit?: string | null): string | null {
  if (explicit) return explicit;
  return (
    getStoredAdminAccessToken() ??
    (typeof document !== 'undefined' ? getAdminAuthTokenFromCookie(document.cookie) : null)
  );
}

export function resolveClientRefreshToken(): string | null {
  return (
    getStoredAdminRefreshToken() ??
    (typeof document !== 'undefined' ? getAdminRefreshTokenFromCookie(document.cookie) : null)
  );
}

/** Refresh session; returns new access token or null. */
export async function refreshClientSession(): Promise<string | null> {
  const refreshToken = resolveClientRefreshToken();
  if (!refreshToken) return null;

  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
    cache: 'no-store',
  });

  if (!response.ok) return null;

  const json = (await response.json()) as {
    data?: { accessToken?: string; refreshToken?: string };
  };

  const accessToken = json.data?.accessToken;
  const newRefresh = json.data?.refreshToken;
  if (!accessToken || !newRefresh) return null;

  useAdminAuthStore.getState().updateSessionTokens(accessToken, newRefresh);
  setAdminAuthTokenCookie(accessToken);
  setAdminRefreshTokenCookie(newRefresh);
  return accessToken;
}
