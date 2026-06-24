import type { AdminMeResponse, AuthResponse } from '@community-marketplace/types';
import { loginSchema } from '@community-marketplace/validation';

import { API_BASE_URL } from '@/lib/constants';
import {
  refreshClientSession,
  resolveClientAccessToken,
} from '@/lib/admin-session';
import { getStoredAdminRole } from '@/store/admin-auth.store';

interface AuthCredentials {
  email: string;
  password: string;
}

async function fetchAuth<T>(endpoint: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    cache: 'no-store',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(error?.message ?? `Request failed with status ${response.status}`);
  }

  const json = (await response.json()) as { data: T };
  return json.data;
}

function resolveAdminRole(role?: 'ADMIN' | 'SUPER_ADMIN'): 'ADMIN' | 'SUPER_ADMIN' {
  if (role === 'SUPER_ADMIN' || role === 'ADMIN') return role;
  return getStoredAdminRole() ?? 'ADMIN';
}

export const adminAuthService = {
  async login(credentials: AuthCredentials): Promise<AuthResponse> {
    loginSchema.parse(credentials);
    return fetchAuth<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  async logout(session: { refreshToken?: string; sessionId?: string }): Promise<void> {
    const token = resolveClientAccessToken();
    await fetchAuth<{ loggedOut: boolean }>('/auth/logout', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: JSON.stringify(session),
    });
  },

  async refresh(refreshToken: string): Promise<AuthResponse> {
    return fetchAuth<AuthResponse>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  },

  async fetchMe(token?: string, role?: 'ADMIN' | 'SUPER_ADMIN'): Promise<AdminMeResponse> {
    const resolvedRole = resolveAdminRole(role);
    const rolePrefix = resolvedRole === 'SUPER_ADMIN' ? '/super-admin' : '/admin';

    let accessToken = resolveClientAccessToken(token);

    const doFetch = (bearer: string | null) =>
      fetch(`${API_BASE_URL}${rolePrefix}/me`, {
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
        },
      });

    let response = await doFetch(accessToken);

    if (response.status === 401) {
      const refreshed = await refreshClientSession();
      if (refreshed) {
        accessToken = refreshed;
        response = await doFetch(accessToken);
      }
    }

    if (!response.ok) throw new Error('Failed to fetch admin profile');
    const json = (await response.json()) as { data: AdminMeResponse };
    return json.data;
  },
};
