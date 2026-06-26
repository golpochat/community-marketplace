export type MarketplaceDisputeStatus =
  | 'open'
  | 'awaiting_evidence'
  | 'under_review'
  | 'resolved_buyer_favored'
  | 'resolved_seller_favored'
  | 'closed';

export type DisputeEvidenceUploaderRole = 'buyer' | 'seller' | 'admin';

export type DisputeReason =
  | 'item_not_received'
  | 'item_not_as_described'
  | 'damaged'
  | 'wrong_item'
  | 'other';

export const DISPUTE_REASONS: readonly DisputeReason[] = [
  'item_not_received',
  'item_not_as_described',
  'damaged',
  'wrong_item',
  'other',
] as const;

export const DISPUTE_REASON_LABELS: Record<DisputeReason, string> = {
  item_not_received: 'Item not received',
  item_not_as_described: 'Item not as described',
  damaged: 'Item arrived damaged',
  wrong_item: 'Wrong item received',
  other: 'Other issue',
};

export const MARKETPLACE_DISPUTE_STATUSES: readonly MarketplaceDisputeStatus[] = [
  'open',
  'awaiting_evidence',
  'under_review',
  'resolved_buyer_favored',
  'resolved_seller_favored',
  'closed',
] as const;

export const DISPUTE_STATUS_LABELS: Record<MarketplaceDisputeStatus, string> = {
  open: 'Open',
  awaiting_evidence: 'Awaiting evidence',
  under_review: 'Under review',
  resolved_buyer_favored: 'Resolved — buyer favored',
  resolved_seller_favored: 'Resolved — seller favored',
  closed: 'Closed',
};

export interface DisputePartySummary {
  id: string;
  displayName?: string;
}

export interface DisputeListingSummary {
  id: string;
  title: string;
  price: number;
  currency: string;
}

export interface DisputeEvidence {
  id: string;
  disputeId: string;
  uploadedById: string;
  uploaderRole: DisputeEvidenceUploaderRole;
  filePath: string;
  fileUrl?: string;
  description?: string;
  createdAt: string;
}

export interface DisputeMessage {
  id: string;
  disputeId: string;
  senderId: string;
  senderName?: string;
  messageText: string;
  createdAt: string;
}

export type DisputeTimelineEventType =
  | 'created'
  | 'message'
  | 'evidence'
  | 'status_change'
  | 'resolution';

export interface DisputeTimelineEvent {
  id: string;
  type: DisputeTimelineEventType;
  label: string;
  detail?: string;
  actorId?: string;
  actorName?: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface MarketplaceDispute {
  id: string;
  buyerId: string;
  sellerId: string;
  listingId: string;
  paymentId?: string;
  reason: DisputeReason;
  description: string;
  disputeStatus: MarketplaceDisputeStatus;
  resolutionNotes?: string;
  resolvedById?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
  buyer?: DisputePartySummary;
  seller?: DisputePartySummary;
  listing?: DisputeListingSummary;
  evidence?: DisputeEvidence[];
  messages?: DisputeMessage[];
  timeline?: DisputeTimelineEvent[];
}

export interface DisputeUploadUrlResponse {
  uploadUrl: string;
  key: string;
  publicUrl: string;
}
