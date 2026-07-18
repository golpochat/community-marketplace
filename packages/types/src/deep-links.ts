/** Deep-link step slugs used in notification `actionUrl` query params (`?step=`). */

export const VERIFICATION_DEEP_LINK_STEPS = [
  'personal_details',
  'phone',
  'id_document',
  'address',
  'submit',
] as const;

export type VerificationDeepLinkStep = (typeof VERIFICATION_DEEP_LINK_STEPS)[number];

export const LISTING_DEEP_LINK_STEPS = [
  'details',
  'pricing',
  'delivery',
  'photos',
  'review',
] as const;

export type ListingDeepLinkStep = (typeof LISTING_DEEP_LINK_STEPS)[number];

export const VERIFICATION_DEEP_LINK_STEP_LABELS: Record<VerificationDeepLinkStep, string> = {
  personal_details: 'Personal details',
  phone: 'Phone verification',
  id_document: 'ID & selfie photos',
  address: 'Address proof',
  submit: 'Review & submit',
};

export const LISTING_DEEP_LINK_STEP_LABELS: Record<ListingDeepLinkStep, string> = {
  details: 'Details / title',
  pricing: 'Pricing',
  delivery: 'Pickup & delivery',
  photos: 'Photos',
  review: 'Review',
};

export function isVerificationDeepLinkStep(value: string): value is VerificationDeepLinkStep {
  return (VERIFICATION_DEEP_LINK_STEPS as readonly string[]).includes(value);
}

export function isListingDeepLinkStep(value: string): value is ListingDeepLinkStep {
  return (LISTING_DEEP_LINK_STEPS as readonly string[]).includes(value);
}

/** Infer a verification wizard step from free-text admin feedback. */
export function inferVerificationDeepLinkStep(message: string): VerificationDeepLinkStep {
  const m = message.toLowerCase();
  if (/phone|otp|sms|mobile/.test(m)) return 'phone';
  if (/address|utility|proof of address|bill/.test(m)) return 'address';
  if (/name|detail|company|cro|legal/.test(m) && !/photo|image|id\b|selfie/.test(m)) {
    return 'personal_details';
  }
  if (/photo|image|selfie|id\b|passport|document|picture/.test(m)) return 'id_document';
  return 'id_document';
}

/** Infer a listing edit wizard step from free-text admin feedback. */
export function inferListingDeepLinkStep(message: string): ListingDeepLinkStep | undefined {
  const m = message.toLowerCase();
  if (/photo|image|picture|pic\b/.test(m)) return 'photos';
  if (/title|name of listing|description/.test(m)) return 'details';
  if (/price|pricing|fee|euro|€/.test(m)) return 'pricing';
  if (/deliver|pickup|collect|postage|shipping/.test(m)) return 'delivery';
  return undefined;
}

export function verificationActionUrl(step?: VerificationDeepLinkStep | string | null): string {
  if (step && isVerificationDeepLinkStep(step)) {
    return `/account/verification?step=${step}`;
  }
  return '/account/verification';
}

export function listingEditActionUrl(
  listingId: string,
  step?: ListingDeepLinkStep | string | null,
): string {
  if (step && isListingDeepLinkStep(step)) {
    return `/account/listings/${listingId}/edit?step=${step}`;
  }
  return `/account/listings/${listingId}/edit`;
}
