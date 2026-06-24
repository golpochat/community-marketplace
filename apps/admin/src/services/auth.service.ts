import type { AuthResponse } from '@community-marketplace/types';
import { loginSchema } from '@community-marketplace/validation';

import { API_BASE_URL } from '@/lib/constants';

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

export const adminAuthService = {
  async login(credentials: AuthCredentials): Promise<AuthResponse> {
    loginSchema.parse(credentials);
    return fetchAuth<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  async logout(session: { refreshToken?: string; sessionId?: string }): Promise<void> {
    const token = getStoredAdminAccessToken();
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
};

function getStoredAdminAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('cm-admin-auth');
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as {
      state?: { session?: { accessToken?: string } | null };
    };
    return parsed.state?.session?.accessToken ?? null;
  } catch {
    return null;
  }
}
