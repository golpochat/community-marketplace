import type { ApiError, ApiResponse } from '@community-marketplace/types';

import { API_BASE_URL } from './constants';
import { refreshClientSession, resolveClientAccessToken } from './admin-session';

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

  let token = resolveClientAccessToken();

  const doFetch = (bearer: string | null) =>
    fetch(url.toString(), {
      credentials: 'include',
      cache: 'no-store',
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
        ...init.headers,
      },
    });

  let response: Response;
  try {
    response = await doFetch(token);
  } catch (err) {
    if (err instanceof TypeError) {
      throw new AdminApiClientError(
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
    }
  }

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
