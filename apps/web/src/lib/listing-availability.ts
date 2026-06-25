import type { ListingStatus } from '@community-marketplace/types';

const UNAVAILABLE_MESSAGES: Partial<Record<ListingStatus, string>> = {
  sold: 'This item has been marked as sold.',
  expired: 'This listing has expired.',
  ended: 'This listing is no longer available.',
  removed: 'This listing has been removed.',
  rejected: 'This listing is not available.',
  paused: 'This listing is temporarily unavailable.',
  draft: 'This listing is not published yet.',
  pending_review: 'This listing is not published yet.',
};

export function getListingUnavailableMessage(status: ListingStatus): string | null {
  if (status === 'active') return null;
  return UNAVAILABLE_MESSAGES[status] ?? 'This listing is not available.';
}
