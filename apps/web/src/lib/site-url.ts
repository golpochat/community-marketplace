import { buildListingPath } from '@/lib/listing-slug';

/** Canonical public site URL for OG tags and share links. */
export function getAppUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  return url.replace(/\/$/, '');
}

export function getListingPageUrl(listing: { id: string; title: string }): string {
  return `${getAppUrl()}${buildListingPath(listing)}`;
}

export function getShortLinkPath(shortCode: string): string {
  return `/l/${shortCode}`;
}

export function getShortLinkUrl(shortCode: string): string {
  return `${getAppUrl()}${getShortLinkPath(shortCode)}`;
}
