import type { ListingStatus } from '@community-marketplace/types';
import type { Metadata } from 'next';

import { NOINDEX_ROBOTS } from '@/lib/seo/constants';

const INDEXABLE_LISTING_STATUS: ListingStatus = 'active';

export function isListingIndexable(status: ListingStatus): boolean {
  return status === INDEXABLE_LISTING_STATUS;
}

export function listingRobotsMetadata(status: ListingStatus): Pick<Metadata, 'robots'> | undefined {
  if (isListingIndexable(status)) return undefined;
  return { robots: NOINDEX_ROBOTS };
}
