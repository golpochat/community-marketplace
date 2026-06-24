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

/** Refresh session; returns new access token or null. */
export async function refreshClientSession(): Promise<string | null> {
  const refreshToken = resolveClientRefreshToken();
  if (!refreshToken) return null;

  const response = await fetch(`${API_BASE_URL}${WEB_API_ROUTES.public.auth.refresh}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
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

  useAuthStore.getState().updateSessionTokens(accessToken, newRefresh);
  return accessToken;
}
