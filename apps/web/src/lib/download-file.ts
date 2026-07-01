import { ApiClientError } from '@/lib/api-client';
import { API_BASE_URL } from '@/lib/constants';
import { refreshClientSession, resolveClientAccessToken } from '@/lib/web-session';

function parseFilename(contentDisposition: string | null, fallback: string): string {
  if (!contentDisposition) return fallback;
  const match = /filename="([^"]+)"/i.exec(contentDisposition);
  return match?.[1] ?? fallback;
}

export async function downloadAuthenticatedFile(
  endpoint: string,
  fallbackFilename: string,
): Promise<void> {
  const url = `${API_BASE_URL}${endpoint}`;
  let token = resolveClientAccessToken();

  const doFetch = (bearer: string | null) =>
    fetch(url, {
      credentials: 'include',
      headers: bearer ? { Authorization: `Bearer ${bearer}` } : {},
    });

  let response = await doFetch(token);

  if (response.status === 401) {
    const refreshed = await refreshClientSession();
    if (refreshed) {
      token = refreshed;
      response = await doFetch(token);
    }
  }

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new ApiClientError(
      error?.message ?? `Download failed with status ${response.status}`,
      response.status,
    );
  }

  const blob = await response.blob();
  const filename = parseFilename(response.headers.get('Content-Disposition'), fallbackFilename);
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}
