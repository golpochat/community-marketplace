export type SellerStatus =
  | 'unverified'
  | 'verification_required'
  | 'verified'
  | 'suspended'
  | 'under_review';

export type SellerVerificationStage =
  | 'phone'
  | 'email'
  | 'identity'
  | 'review'
  | 'complete';

export type SellerVerificationNextStep =
  | 'phone'
  | 'email'
  | 'id_document'
  | 'selfie'
  | 'address'
  | 'submit'
  | 'review'
  | 'complete';

export interface SellerVerificationStartResponse {
  requestId: string;
  nextRequiredStep: SellerVerificationNextStep;
  sellerStatus: SellerStatus;
  phoneVerified: boolean;
  emailVerified: boolean;
}

export interface SellerVerificationRequest {
  id: string;
  userId: string;
  phoneNumber?: string;
  idDocumentPath?: string;
  selfiePath?: string;
  addressDocumentPath?: string;
  status: 'pending' | 'approved' | 'rejected';
  priority?: boolean;
  reviewedById?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SellerStatusHistoryEntry {
  id: string;
  userId: string;
  oldStatus: SellerStatus;
  newStatus: SellerStatus;
  changedBy?: string;
  changedByName?: string;
  reason?: string;
  createdAt: string;
}

export interface SellerVerificationStatus {
  sellerStatus: SellerStatus;
  /** @deprecated Use approvedListingCount — kept for older clients */
  unverifiedListingCount: number;
  approvedListingCount: number;
  sellerLimit: number;
  phoneVerified: boolean;
  emailVerified: boolean;
  idVerified: boolean;
  currentStage: SellerVerificationStage;
  nudgeMessage?: string;
  verificationRequestedAt?: string;
  verificationCompletedAt?: string;
  verificationRejectedReason?: string;
  pendingRequest?: SellerVerificationRequest | null;
}

export interface SellerListingGateResult {
  allowed: boolean;
  nudgeMessage?: string;
  blockMessage?: string;
  blockCode?: string;
}

export type AdminSellerVerificationView =
  | 'pending'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'suspended';

export interface AdminSellerVerificationRow {
  requestId?: string;
  userId: string;
  sellerName?: string;
  email: string;
  phone?: string;
  submittedAt?: string;
  requestStatus?: 'pending' | 'approved' | 'rejected';
  priority?: boolean;
  sellerStatus: SellerStatus;
  verificationRequestedAt?: string;
  verificationCompletedAt?: string;
  rejectionReason?: string;
  unverifiedListingCount: number;
  sellerLimit: number;
  totalListings: number;
  joinedAt: string;
  idDocumentPath?: string;
  selfiePath?: string;
  addressDocumentPath?: string;
}

export interface AdminSellerVerificationDetail extends AdminSellerVerificationRow {
  previousAttempts: SellerVerificationRequest[];
  changedByName?: string;
}

export const SELLER_VERIFICATION_MESSAGES = {
  NUDGE_FIRST_LISTING: 'Verified sellers get more visibility.',
  NUDGE_THIRD_LISTING: 'Verify now to unlock unlimited listings.',
  NUDGE_ONE_LEFT: 'Only 1 listing left before verification is required.',
  NUDGE_LIMIT_REACHED: 'Verification required soon.',
  BLOCK_VERIFICATION_REQUIRED: 'Verification required to continue listing.',
  UNDER_REVIEW: 'Your verification is under review.',
  APPROVED: 'Your verification was approved.',
  REJECTED_PREFIX: 'Your verification was rejected:',
  SUSPENDED: 'Your seller account has been suspended.',
  REACTIVATED: 'Your seller account has been reactivated.',
  FORCE_REVERIFY: 'Your account requires re-verification.',
  MAX_UNVERIFIED: 'You have reached the maximum number of unverified listings.',
  STRIPE_REQUIRES_VERIFICATION:
    'Complete seller verification before setting up Stripe payouts.',
  MONETIZATION_REQUIRES_VERIFICATION:
    'Complete seller verification before boosting or featuring listings.',
} as const;

export function isSellerVerified(status: SellerStatus | null | undefined): boolean {
  return status === 'verified';
}
