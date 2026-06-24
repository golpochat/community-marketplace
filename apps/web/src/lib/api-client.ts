import type { ApiError, ApiResponse } from '@community-marketplace/types';

import { useAuthStore } from '@/store/auth.store';

import { API_BASE_URL } from './constants';
import { unwrapApiResponse } from './normalize-api-response';
import { refreshClientSession, resolveClientAccessToken } from './web-session';

type RequestOptions = RequestInit & {
  params?: Record<string, string>;
};

function getDeviceFingerprint(): string {
  if (typeof window === 'undefined') return 'server';
  const material = [
    navigator.userAgent,
    navigator.language,
    String(screen.width),
    String(screen.height),
  ].join('|');
  let hash = 0;
  for (let i = 0; i < material.length; i += 1) {
    hash = (hash << 5) - hash + material.charCodeAt(i);
    hash |= 0;
  }
  return `web-${Math.abs(hash).toString(16)}`;
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<ApiResponse<T>> {
  const { params, ...init } = options;
  const url = new URL(`${API_BASE_URL}${endpoint}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  }

  let token = resolveClientAccessToken();

  const doFetch = (bearer: string | null) =>
    fetch(url.toString(), {
      credentials: 'include',
      ...init,
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Fingerprint': getDeviceFingerprint(),
        ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
        ...init.headers,
      },
    });

  let response: Response;
  try {
    response = await doFetch(token);
  } catch (err) {
    if (err instanceof TypeError) {
      throw new ApiClientError(
        `Cannot reach the API at ${API_BASE_URL}. Start it with: pnpm --filter api dev`,
        0,
        'NETWORK_ERROR',
      );
    }
    throw err;
  }

  if (response.status === 401) {
    const refreshed = await refreshClientSession();
    if (refreshed) {
      token = refreshed;
      response = await doFetch(token);
    } else {
      useAuthStore.getState().clearUser();
    }
  }

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as ApiError | null;
    throw new ApiClientError(
      error?.message ?? `Request failed with status ${response.status}`,
      response.status,
      error?.code,
    );
  }

  const json = (await response.json()) as ApiResponse<T>;
  return unwrapApiResponse(json);
}
