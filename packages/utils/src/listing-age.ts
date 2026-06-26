import { formatRelativeTime } from './date';

function prefixRelative(prefix: string, relative: string): string {
  if (relative === 'yesterday' || relative === 'today') {
    return `${prefix} ${relative}`;
  }
  return `${prefix} ${relative}`;
}

/** e.g. "Listed 3 days ago" */
export function formatListedAgo(value: string | Date): string {
  return prefixRelative('Listed', formatRelativeTime(value));
}

/** Short label for recently listed items (< 48h). Never uses the word "New". */
export function formatJustListedLabel(value: string | Date): string {
  const listed = new Date(value).getTime();
  if (Number.isNaN(listed)) return 'Just listed';
  const hours = (Date.now() - listed) / (1000 * 60 * 60);
  if (hours < 1) return 'Just listed';
  if (hours < 48) return formatListedAgo(value);
  return formatListedAgo(value);
}

/** True when a listing went live within the last 48 hours. */
export function isFreshListing(value: string | Date): boolean {
  const listed = new Date(value).getTime();
  if (Number.isNaN(listed)) return false;
  const hours = (Date.now() - listed) / (1000 * 60 * 60);
  return hours >= 0 && hours < 48;
}

/** @deprecated Use isFreshListing */
export const isNewListing = isFreshListing;

/** e.g. "Updated 2 hours ago" */
export function formatUpdatedAgo(value: string | Date): string {
  return prefixRelative('Updated', formatRelativeTime(value));
}

/** Prefer activatedAt when a listing has gone live. */
export function resolveListingListedAt(
  createdAt: string,
  activatedAt?: string,
): string {
  return activatedAt ?? createdAt;
}
