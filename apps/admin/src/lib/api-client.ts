import type { ApiError, ApiResponse } from '@community-marketplace/types';

import { API_BASE_URL } from './constants';
import { getStoredAdminAccessToken } from '@/store/admin-auth.store';

type RequestOptions = RequestInit & {
  params?: Record<string, string>;
};

export class AdminApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
    this.name = 'AdminApiClientError';
  }
}

export async function adminApiClient<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { params, ...init } = options;
  const url = new URL(`${API_BASE_URL}${endpoint}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  }

  const token = getStoredAdminAccessToken();
  const response = await fetch(url.toString(), {
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
    throw new AdminApiClientError(
      error?.message ?? `API error: ${response.status}`,
      response.status,
      error?.code,
    );
  }

  const json = (await response.json()) as ApiResponse<T>;
  return json.data;
}
