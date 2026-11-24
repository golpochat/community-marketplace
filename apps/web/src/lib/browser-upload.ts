import { ensureCsrfToken, clearCsrfToken } from '@/lib/api-client';

/**
 * PUT a file to an API-proxied upload URL (`/api/dev-upload?...`).
 * Must send CSRF + cookies — the global CsrfGuard rejects bare PUTs with 403.
 */
export async function putBrowserUpload(
  uploadUrl: string,
  file: Blob,
  contentType = file.type || 'application/octet-stream',
): Promise<Response> {
  const doPut = async (csrf: string) =>
    fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      credentials: 'include',
      headers: {
        'Content-Type': contentType,
        'x-csrf-token': csrf,
      },
    });

  let csrf = await ensureCsrfToken();
  let response = await doPut(csrf);
  if (response.status === 403) {
    clearCsrfToken();
    csrf = await ensureCsrfToken();
    response = await doPut(csrf);
  }
  return response;
}
