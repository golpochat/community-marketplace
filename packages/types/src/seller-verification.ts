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
  | 'personal_details'
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
  /** Unified cross-flow state: pending, verified, or manual-review. */
  unifiedState?: import('./verification').UnifiedVerificationState;
  personalDetailsComplete?: boolean;
  personalDetailsNameComplete?: boolean;
  businessDetailsComplete?: boolean;
  isBusinessAccount?: boolean;
  businessStructure?: import('./verification').SellerBusinessStructure;
  /**
   * Own-account only — private legal identity for rehydrating the verification wizard.
   * Never expose on public/storefront payloads.
   */
  legalName?: string;
  registeredCompanyName?: string;
  croNumber?: string;
  /** Own-account phone for wizard rehydrate (E.164 or local format as stored). */
  phone?: string;
  publicDisplayName?: string;
  businessName?: string;
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

/** Target review window for paid fast-track cases (hours from submission). */
export const FAST_TRACK_REVIEW_SLA_HOURS = 24;

export function computeFastTrackReviewDueAt(submittedAt: string | Date): string {
  const base = typeof submittedAt === 'string' ? new Date(submittedAt) : submittedAt;
  return new Date(
    base.getTime() + FAST_TRACK_REVIEW_SLA_HOURS * 60 * 60 * 1000,
  ).toISOString();
}

/** Human-readable SLA label for admin/seller surfaces. */
export function formatFastTrackSlaLabel(reviewDueAt: string, now: Date = new Date()): string {
  const due = new Date(reviewDueAt);
  const diffMs = due.getTime() - now.getTime();
  if (diffMs >= 0) {
    const hours = Math.ceil(diffMs / (60 * 60 * 1000));
    return hours <= 1 ? 'Due within 1h' : `Due in ${hours}h`;
  }
  const overdueHours = Math.ceil(Math.abs(diffMs) / (60 * 60 * 1000));
  return overdueHours <= 1 ? 'Overdue' : `Overdue ${overdueHours}h`;
}

export type AdminSellerVerificationTrackFilter = 'all' | 'fast_track' | 'standard';

export interface AdminSellerVerificationRow {
  requestId?: string;
  userId: string;
  sellerName?: string;
  /** Private legal name for admin review only. */
  legalName?: string;
  isBusinessAccount?: boolean;
  businessStructure?: import('./verification').SellerBusinessStructure;
  businessName?: string;
  registeredCompanyName?: string;
  croNumber?: string;
  email: string;
  phone?: string;
  submittedAt?: string;
  requestStatus?: 'pending' | 'approved' | 'rejected';
  priority?: boolean;
  /** ISO timestamp — fast-track SLA target (submission + 24h). */
  reviewDueAt?: string;
  priorityActivatedAt?: string;
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

export const REGISTRATION_SELLER_KIND_OPTIONS = [
  {
    value: 'individual' as const,
    label: 'Individual seller',
    description: 'Selling personally under your own name or nickname.',
  },
  {
    value: 'sole_trader' as const,
    label: 'Sole trader',
    description: 'Trading under a business name as a self-employed seller.',
  },
  {
    value: 'limited_company' as const,
    label: 'Limited company',
    description: 'Selling on behalf of a registered Irish company (Ltd).',
  },
] as const;

export const SELLER_VERIFICATION_MESSAGES = {
  NUDGE_FIRST_LISTING: 'Verified sellers get more visibility.',
  NUDGE_THIRD_LISTING: 'Verify now to unlock unlimited listings.',
  NUDGE_ONE_LEFT: 'Only 1 listing left before verification is required.',
  NUDGE_LIMIT_REACHED: 'Verification required soon.',
  BLOCK_VERIFICATION_REQUIRED: 'Verification required to continue listing.',
  UNDER_REVIEW: 'Your verification is under review.',
  APPROVED: 'Your verification was approved.',
  REJECTED_PREFIX: 'Your verification was rejected:',
  FAST_TRACK_REQUEUE_GRANTED:
    'Your next resubmission will receive one complimentary priority review (fast-track queue). Payment covers review speed, not approval.',
  SUSPENDED: 'Your seller account has been suspended.',
  REACTIVATED: 'Your seller account has been reactivated.',
  FORCE_REVERIFY: 'Your account requires re-verification.',
  MAX_UNVERIFIED: 'You have reached the maximum number of unverified listings.',
  STRIPE_REQUIRES_VERIFICATION:
    'Complete seller verification before setting up Stripe payouts.',
  MONETIZATION_REQUIRES_VERIFICATION:
    'Complete seller verification before boosting or featuring listings.',
} as const;

export function isSellerVerified(
  status: SellerStatus | string | null | undefined,
): boolean {
  return status === 'verified';
}
