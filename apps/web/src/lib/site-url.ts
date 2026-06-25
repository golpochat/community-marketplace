/** Canonical public site URL for OG tags and share links. */
export function getAppUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  return url.replace(/\/$/, '');
}

export function getListingPageUrl(listingId: string): string {
  return `${getAppUrl()}/listings/${listingId}`;
}

export function getShortLinkPath(shortCode: string): string {
  return `/l/${shortCode}`;
}

export function getShortLinkUrl(shortCode: string): string {
  return `${getAppUrl()}${getShortLinkPath(shortCode)}`;
}
