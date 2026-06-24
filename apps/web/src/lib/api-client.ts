import type { ApiError, ApiResponse } from '@community-marketplace/types';

import { API_BASE_URL } from './constants';

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

  const response = await fetch(url.toString(), {
    credentials: 'include',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-Device-Fingerprint': getDeviceFingerprint(),
      ...init.headers,
    },
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as ApiError | null;
    throw new ApiClientError(
      error?.message ?? `Request failed with status ${response.status}`,
      response.status,
      error?.code,
    );
  }

  return response.json() as Promise<ApiResponse<T>>;
}
