export type DeliveryZone = 'COLLECTION' | 'LOCAL' | 'NATIONAL' | 'CUSTOM';

export type DeliveryChangeStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type DeliveryUpdateStatus = 'auto-approved' | 'pending-review';

export interface DeliveryOption {
  id: string;
  label: string;
  description: string;
  zone: DeliveryZone;
  defaultPrice?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ListingDeliverySelection {
  id?: string;
  deliveryOptionId: string;
  customLabel?: string;
  customPrice?: number;
  /** Resolved from catalog when mapped */
  label?: string;
  zone?: DeliveryZone;
  price?: number;
}

export interface DeliveryChangeSnapshot {
  before: ListingDeliverySelection[];
  after: ListingDeliverySelection[];
  reviewReasons?: string[];
}

export interface DeliveryChangeLog {
  id: string;
  listingId: string;
  sellerId: string;
  changes: DeliveryChangeSnapshot;
  requiresReview: boolean;
  status: DeliveryChangeStatus;
  reviewNotes?: string;
  reviewedById?: string;
  createdAt: string;
  reviewedAt?: string;
  listing?: { id: string; title: string; status: string };
  seller?: { id: string; displayName?: string; email: string };
}

export interface DeliveryPreview {
  listingId: string;
  listingTitle: string;
  listingStatus: string;
  current: ListingDeliverySelection[];
  proposed: ListingDeliverySelection[];
  diff: {
    added: ListingDeliverySelection[];
    removed: ListingDeliverySelection[];
    changed: Array<{ before: ListingDeliverySelection; after: ListingDeliverySelection }>;
  };
  wouldRequireReview: boolean;
  reviewReasons: string[];
}

export interface DeliveryUpdateResult {
  status: DeliveryUpdateStatus;
  preview: DeliveryPreview;
  changeLogId?: string;
  deliveryOptions: ListingDeliverySelection[];
  pendingDeliveryOptions?: ListingDeliverySelection[];
}

export interface ListingDeliveryState {
  deliveryOptions: ListingDeliverySelection[];
  pendingDeliveryOptions?: ListingDeliverySelection[];
  deliveryReviewStatus?: 'none' | 'pending-review' | 'rejected';
  pendingChangeLogId?: string;
  reviewNotes?: string;
}
