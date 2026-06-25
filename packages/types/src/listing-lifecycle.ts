import type { ListingPackageType, ListingStatus } from './listing';

export type ListingStatusActorType = 'SELLER' | 'ADMIN' | 'SYSTEM';

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
