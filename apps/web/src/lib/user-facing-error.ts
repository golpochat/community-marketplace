/**
 * Maps technical / local-dev errors to copy safe for buyers and sellers.
 * Prefer a clear server validation message when it is already human-readable.
 */

const TECHNICAL_MESSAGE_PATTERNS = [
  /\bpnpm\b/i,
  /\bport\s*\d+/i,
  /\blocalhost\b/i,
  /127\.0\.0\.1/,
  /\bAPI_BASE_URL\b/i,
  /\bCSRF\b/i,
  /\bECONNREFUSED\b/i,
  /\bprisma\b/i,
  /\bstack trace\b/i,
  /Request failed with status/i,
  /Cannot reach the API/i,
  /Start it with:/i,
  /from the API/i,
  /Is the API running/i,
  /Make sure the API is running/i,
  /no id was returned/i,
  /Run `pnpm/i,
];

export const USER_FACING_ERRORS = {
  network:
    'We could not reach SellNearby right now. Please check your connection and try again.',
  session: 'Your session expired. Please refresh the page and try again.',
  permission: 'You do not have permission to do that.',
  notFound: 'We could not find what you were looking for.',
  rateLimited: 'Too many attempts. Please wait a moment and try again.',
  server: 'Something went wrong on our side. Please try again shortly.',
  generic: 'Something went wrong. Please try again.',
  photoUpload:
    'We could not upload that photo. Please try again, or choose a different JPG or PNG image.',
  logoUpload:
    'We could not upload that logo. Please try again, or choose a different JPG or PNG image.',
  bannerUpload:
    'We could not upload that banner. Please try again, or choose a different JPG or PNG image.',
  categoriesUnavailable:
    'Categories are temporarily unavailable. Please refresh the page and try again.',
  listingCreateIncomplete:
    'Your listing could not be finished. Please try saving again.',
  draftSavedPhotoFailed:
    'Draft saved, but we could not upload your photo. Open the listing from My listings to add photos, then submit for review.',
} as const;

export function isTechnicalErrorMessage(message: string): boolean {
  const trimmed = message.trim();
  if (!trimmed) return true;
  return TECHNICAL_MESSAGE_PATTERNS.some((pattern) => pattern.test(trimmed));
}

export function userFacingHttpFallback(status: number): string {
  if (status === 0) return USER_FACING_ERRORS.network;
  if (status === 401) return 'Please sign in again to continue.';
  if (status === 403) return USER_FACING_ERRORS.permission;
  if (status === 404) return USER_FACING_ERRORS.notFound;
  if (status === 429) return USER_FACING_ERRORS.rateLimited;
  if (status >= 500) return USER_FACING_ERRORS.server;
  return USER_FACING_ERRORS.generic;
}

/** Prefer a human server message; otherwise map status / technical copy to a safe fallback. */
export function resolveUserFacingMessage(
  message: string | undefined | null,
  status: number,
  fallback: string = USER_FACING_ERRORS.generic,
): string {
  const trimmed = message?.trim();
  if (trimmed && !isTechnicalErrorMessage(trimmed)) {
    return trimmed;
  }
  if (status > 0) {
    return userFacingHttpFallback(status);
  }
  return fallback;
}

export function userFacingErrorMessage(
  err: unknown,
  fallback: string = USER_FACING_ERRORS.generic,
): string {
  if (err && typeof err === 'object' && 'message' in err) {
    const status =
      'status' in err && typeof (err as { status?: unknown }).status === 'number'
        ? (err as { status: number }).status
        : 0;
    const message = String((err as { message?: unknown }).message ?? '');
    return resolveUserFacingMessage(message, status, fallback);
  }
  return fallback;
}
