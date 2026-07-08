import type { SellerStatus, SellerVerificationNextStep, SellerVerificationStage } from './seller-verification';

/** Cross-flow verification lifecycle shared by personal-details and fast-track paths. */
export type UnifiedVerificationState = 'pending' | 'verified' | 'manual-review';

export type SellerBusinessStructure = 'individual' | 'sole_trader' | 'limited_company';

export type SellerRegistrationKind = SellerBusinessStructure;

export interface PersonalDetailsSnapshot {
  /** Private legal name — never public. */
  legalName: string;
  /** @deprecated Use legalName */
  fullName: string;
  email: string;
  phone?: string;
  complete: boolean;
  missingFields: Array<'legalName' | 'email' | 'phone' | 'registeredCompanyName' | 'croNumber'>;
  businessDetailsComplete: boolean;
  publicDisplayName?: string;
  businessName?: string;
  isBusinessAccount: boolean;
  businessStructure?: SellerBusinessStructure;
  registeredCompanyName?: string;
  croNumber?: string;
}

export interface AcceleratedVerificationSignals {
  phoneOtpVerified: boolean;
  emailVerified: boolean;
  /** Registration completed with a verified phone token (community signup path). */
  registrationPhoneVerified: boolean;
  /** Stripe Connect onboarding completed — payout identity signal, not a bypass. */
  stripeConnectOnboarded: boolean;
  /** Any automated signal present; still requires personal details + document review. */
  hasAcceleratedSignals: boolean;
}

export interface UnifiedVerificationContext {
  unifiedState: UnifiedVerificationState;
  personalDetails: PersonalDetailsSnapshot;
  acceleratedSignals: AcceleratedVerificationSignals;
}

export const VERIFICATION_ONBOARDING_COPY = {
  PERSONAL_DETAILS_PRIVATE:
    'Your personal details are private and are never shown on your public profile or listings.',
  VERIFICATION_REQUIRED:
    'Verification is required for community safety and fraud prevention before you can sell without limits.',
  VERIFICATION_PAGE_SUBTITLE: 'Complete these steps to sell without limits.',
  FAST_TRACK_EXPLAINER:
    'Fast-track verification speeds up review using signals you have already provided — phone OTP, email verification, OAuth sign-in, or Stripe identity checks. It does not skip verification or replace document review when required.',
  PERSONAL_DETAILS_REQUIRED:
    'Enter your full legal name exactly as it appears on your government ID. It must match the documents you upload.',
  PUBLIC_NAME_DIFFERS:
    'Your public profile name can differ from your legal identity. Verification uses your legal name only for safety checks.',
  REGISTRATION_PUBLIC_NAME:
    'This is the name buyers will see. Your legal identity is collected later during verification and stays private.',
  REGISTRATION_BUSINESS_NAME:
    'Use your business or trading name as buyers will see it. The owner’s legal identity is verified later and stays private.',
  REGISTRATION_EMAIL_PRIVATE:
    'Used to verify your account and send important updates. Your email is never shown on your profile or shared with other users.',
  CONTACT_VERIFIED_AT_REGISTRATION:
    'Your email and phone were verified when you created your account.',
} as const;

export { REGISTRATION_SELLER_KIND_OPTIONS } from './seller-verification';

export function mapSellerStatusToUnifiedState(input: {
  sellerStatus: SellerStatus;
  verificationRequestedAt?: string | Date | null;
  idVerified?: boolean;
}): UnifiedVerificationState {
  if (input.sellerStatus === 'verified' || input.idVerified) {
    return 'verified';
  }
  if (
    input.sellerStatus === 'under_review' ||
    Boolean(input.verificationRequestedAt)
  ) {
    return 'manual-review';
  }
  return 'pending';
}

export function resolveUnifiedVerificationNextStep(input: {
  sellerStatus: SellerStatus;
  verificationRequestedAt?: string | null;
  phoneVerified: boolean;
  emailVerified: boolean;
  personalDetailsNameComplete: boolean;
  personalDetailsComplete: boolean;
  idVerified: boolean;
  idDocumentPath?: string | null;
  selfiePath?: string | null;
  addressDocumentPath?: string | null;
}): SellerVerificationNextStep {
  if (input.sellerStatus === 'verified' || input.idVerified) return 'complete';
  if (input.verificationRequestedAt) return 'review';
  if (!input.personalDetailsNameComplete || !input.personalDetailsComplete) return 'personal_details';
  if (!input.phoneVerified) return 'phone';
  if (!input.emailVerified) return 'email';
  if (!input.idDocumentPath) return 'id_document';
  if (!input.selfiePath) return 'selfie';
  if (!input.addressDocumentPath) return 'address';
  return 'submit';
}

export function resolveUnifiedVerificationStage(input: {
  phoneVerified: boolean;
  emailVerified: boolean;
  personalDetailsNameComplete: boolean;
  personalDetailsComplete: boolean;
  sellerStatus: SellerStatus;
  verificationSubmitted: boolean;
  idVerified: boolean;
}): SellerVerificationStage {
  if (input.sellerStatus === 'verified' || input.idVerified) return 'complete';
  if (input.verificationSubmitted) return 'review';
  if (!input.personalDetailsNameComplete || !input.personalDetailsComplete) return 'phone';
  if (!input.phoneVerified) return 'phone';
  if (!input.emailVerified) return 'email';
  return 'identity';
}
