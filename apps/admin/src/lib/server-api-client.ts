import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import type { ApiError, ApiResponse } from '@community-marketplace/types';

import { SERVER_API_BASE_URL } from './constants';
import { ADMIN_APP_ROUTES } from './rbac-routes';
import {
  AUTH_TOKEN_COOKIE_NAME,
  getAdminAuthTokenFromCookie,
  getAdminRefreshTokenFromCookie,
  getAdminRoleFromCookie,
  REFRESH_TOKEN_COOKIE_NAME,
} from './role-cookie';

export async function getServerAdminContext() {
  const jar = await cookies();
  const cookieHeader = jar.toString();
  return {
    role: getAdminRoleFromCookie(cookieHeader),
    token: getAdminAuthTokenFromCookie(cookieHeader),
  };
}

export async function serverAdminApiClient<T>(endpoint: string, init: RequestInit = {}): Promise<T> {
  let { token } = await getServerAdminContext();

  const doFetch = (bearer: string | null) =>
    fetch(`${SERVER_API_BASE_URL}${endpoint}`, {
      credentials: 'include',
      cache: 'no-store',
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
        ...init.headers,
      },
    });

  let response = await doFetch(token);

  if (response.status === 401) {
    const jar = await cookies();
    const refreshToken = getAdminRefreshTokenFromCookie(jar.toString());
    if (refreshToken) {
      const refreshRes = await fetch(`${SERVER_API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
        cache: 'no-store',
      });
      if (refreshRes.ok) {
        const refreshed = (await refreshRes.json()) as ApiResponse<{
          accessToken: string;
          refreshToken: string;
        }>;
        token = refreshed.data.accessToken;
        jar.set(AUTH_TOKEN_COOKIE_NAME, encodeURIComponent(refreshed.data.accessToken), {
          path: '/',
          sameSite: 'lax',
        });
        jar.set(REFRESH_TOKEN_COOKIE_NAME, encodeURIComponent(refreshed.data.refreshToken), {
          path: '/',
          sameSite: 'lax',
        });
        response = await doFetch(token);
      }
    }
  }

  if (response.status === 401) {
    redirect(ADMIN_APP_ROUTES.login);
  }

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as ApiError | null;
    throw new Error(error?.message ?? `API error: ${response.status}`);
  }

  const json = (await response.json()) as ApiResponse<T>;
  return json.data;
}
