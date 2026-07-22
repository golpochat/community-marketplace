export type ListingReserveStatus =
  | 'pending_seller'
  | 'active'
  | 'converted'
  | 'declined'
  | 'cancelled_buyer'
  | 'cancelled_seller'
  | 'expired_pending'
  | 'expired';

export type ListingReserveWindowHours = 4 | 12 | 24;

export const LISTING_RESERVE_WINDOW_HOURS = [4, 12, 24] as const;
export const LISTING_RESERVE_DEFAULT_WINDOW_HOURS = 12 as const;
export const LISTING_RESERVE_PENDING_TTL_HOURS = 2 as const;

export interface ListingReserve {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  status: ListingReserveStatus;
  windowHours?: number;
  requestedAt: string;
  decisionAt?: string;
  startsAt?: string;
  expiresAt?: string;
  pendingExpiresAt: string;
  listingPriceSnapshot?: number;
  createdAt: string;
  updatedAt: string;
  listingTitle?: string;
  listingImageUrl?: string;
  buyerDisplayName?: string;
  buyerEmail?: string;
}

/** Summary attached to listing detail for reserve CTA / state. */
export interface ListingReservationSummary {
  canRequest: boolean;
  /** Why request is blocked (for copy). */
  blockReason?:
    | 'unauthenticated'
    | 'unverified'
    | 'own_listing'
    | 'not_active'
    | 'already_pending'
    | 'already_reserved'
    | 'reserved_by_other';
  reserveWindowHours: number;
  mine?: ListingReserve | null;
  active?: ListingReserve | null;
  /** True when current viewer is the reserving buyer on an active hold. */
  iAmReservingBuyer: boolean;
}
