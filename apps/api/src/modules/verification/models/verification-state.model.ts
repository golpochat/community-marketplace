import type { SellerStatus, SellerVerificationNextStep } from '@community-marketplace/types';
import {
  mapSellerStatusToUnifiedState,
  resolveUnifiedVerificationNextStep,
  resolveUnifiedVerificationStage,
  type AcceleratedVerificationSignals,
  type PersonalDetailsSnapshot,
  type SellerBusinessStructure,
  type UnifiedVerificationContext,
  type UnifiedVerificationState,
} from '@community-marketplace/types';
import {
  assessBusinessDetailsCompleteness,
  assessPersonalDetailsCompleteness,
  assessPersonalDetailsNameComplete,
  sellerPersonalDetailsUpdateSchema,
} from '@community-marketplace/validation';

export {
  mapSellerStatusToUnifiedState,
  resolveUnifiedVerificationNextStep,
  resolveUnifiedVerificationStage,
};

export type {
  AcceleratedVerificationSignals,
  PersonalDetailsSnapshot,
  UnifiedVerificationContext,
  UnifiedVerificationState,
};

export function buildPersonalDetailsSnapshot(input: {
  legalName?: string | null;
  displayName?: string | null;
  email?: string | null;
  phone?: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  isBusinessAccount?: boolean;
  businessStructure?: SellerBusinessStructure | string | null;
  businessName?: string | null;
  registeredCompanyName?: string | null;
  croNumber?: string | null;
}): PersonalDetailsSnapshot {
  const legalName = input.legalName?.trim() ?? '';
  const { complete, missingFields } = assessPersonalDetailsCompleteness({
    legalName,
    email: input.email,
    phone: input.phone,
    emailVerified: input.emailVerified,
    phoneVerified: input.phoneVerified,
    isBusinessAccount: input.isBusinessAccount,
    businessStructure: input.businessStructure,
    registeredCompanyName: input.registeredCompanyName,
    croNumber: input.croNumber,
  });
  const business = assessBusinessDetailsCompleteness(input);

  return {
    legalName,
    fullName: legalName,
    email: input.email?.trim() ?? '',
    phone: input.phone?.trim() || undefined,
    complete,
    missingFields,
    businessDetailsComplete: business.complete,
    publicDisplayName: input.displayName?.trim() || undefined,
    businessName: input.businessName?.trim() || undefined,
    isBusinessAccount: input.isBusinessAccount ?? false,
    businessStructure: (input.businessStructure as SellerBusinessStructure | undefined) ?? undefined,
    registeredCompanyName: input.registeredCompanyName?.trim() || undefined,
    croNumber: input.croNumber?.trim() || undefined,
  };
}

export function buildAcceleratedSignals(input: {
  phoneVerified: boolean;
  emailVerified: boolean;
  phoneVerifiedAt?: Date | null;
  stripeChargesEnabled?: boolean;
  stripePayoutsEnabled?: boolean;
}): AcceleratedVerificationSignals {
  const stripeConnectOnboarded = Boolean(
    input.stripeChargesEnabled && input.stripePayoutsEnabled,
  );
  const registrationPhoneVerified = input.phoneVerified && Boolean(input.phoneVerifiedAt);
  const phoneOtpVerified = input.phoneVerified;
  const emailVerified = input.emailVerified;

  return {
    phoneOtpVerified,
    emailVerified,
    registrationPhoneVerified,
    stripeConnectOnboarded,
    hasAcceleratedSignals:
      phoneOtpVerified || emailVerified || registrationPhoneVerified || stripeConnectOnboarded,
  };
}

export function resolveNextStepFromStatus(input: {
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
  return resolveUnifiedVerificationNextStep(input);
}

export function parsePersonalDetailsUpdate(input: unknown) {
  const parsed = sellerPersonalDetailsUpdateSchema.parse(input);
  return {
    ...parsed,
    legalName: parsed.legalName ?? parsed.fullName,
  };
}
