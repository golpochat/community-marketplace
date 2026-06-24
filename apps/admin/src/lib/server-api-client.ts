import { cookies } from 'next/headers';

import type { ApiError, ApiResponse } from '@community-marketplace/types';

import { API_BASE_URL } from './constants';
import { getAdminAuthTokenFromCookie, getAdminRoleFromCookie } from './role-cookie';

export async function getServerAdminContext() {
  const jar = await cookies();
  const cookieHeader = jar.toString();
  return {
    role: getAdminRoleFromCookie(cookieHeader),
    token: getAdminAuthTokenFromCookie(cookieHeader),
  };
}

export async function serverAdminApiClient<T>(endpoint: string, init: RequestInit = {}): Promise<T> {
  const { token } = await getServerAdminContext();
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    credentials: 'include',
    cache: 'no-store',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as ApiError | null;
    throw new Error(error?.message ?? `API error: ${response.status}`);
  }

  const json = (await response.json()) as ApiResponse<T>;
  return json.data;
}
