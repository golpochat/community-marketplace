export type TitleChangeStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type TitleUpdateStatus = 'unchanged' | 'pending-review';

export interface ListingTitleState {
  liveTitle: string;
  pendingTitle?: string;
  titleReviewStatus: 'none' | 'pending-review' | 'rejected';
  pendingChangeLogId?: string;
  reviewNotes?: string;
  /** True when listing was previously admin-approved (activatedAt set) and status allows amend. */
  titleAmendRequired: boolean;
  similarityScore?: number;
}

export interface TitleUpdateResult {
  status: TitleUpdateStatus;
  liveTitle: string;
  pendingTitle?: string;
  changeLogId?: string;
  similarityScore?: number;
  message?: string;
}

export interface TitleChangeLog {
  id: string;
  listingId: string;
  sellerId: string;
  oldTitle: string;
  newTitle: string;
  similarityScore: number;
  requiresReview: boolean;
  status: TitleChangeStatus;
  reviewNotes?: string;
  reviewedById?: string;
  createdAt: string;
  reviewedAt?: string;
  listing?: { id: string; title: string; status: string };
  seller?: { id: string; displayName?: string; email: string };
}
