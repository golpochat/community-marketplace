import type { ListingPackageType, ListingStatus } from './listing';

export type ListingStatusActorType = 'SELLER' | 'ADMIN' | 'SYSTEM';

export const LISTING_SALE_CLOSE_CHANNELS = [
  'card_on_platform',
  'cash_collection',
  'off_platform',
  'other',
] as const;

export type ListingSaleCloseChannel = (typeof LISTING_SALE_CLOSE_CHANNELS)[number];

export interface ListingStatusChangeLog {
  id: string;
  listingId: string;
  fromStatus?: ListingStatus;
  toStatus: ListingStatus;
  changedByType: ListingStatusActorType;
  changedById?: string;
  reason?: string;
  createdAt: string;
}

export type { ListingPackageType };
