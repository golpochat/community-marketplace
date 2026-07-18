import {
  isListingDeepLinkStep,
  isVerificationDeepLinkStep,
  type ListingDeepLinkStep,
  type VerificationDeepLinkStep,
} from '@community-marketplace/types';

/** Map verification `?step=` slug → wizard index (0–4). */
export function verificationStepIndex(step: string | null | undefined): number | null {
  if (!step) return null;
  const normalized = step.trim().toLowerCase();
  const aliases: Record<string, VerificationDeepLinkStep> = {
    details: 'personal_details',
    personal_details: 'personal_details',
    phone: 'phone',
    id: 'id_document',
    id_document: 'id_document',
    selfie: 'id_document',
    photos: 'id_document',
    identity: 'id_document',
    address: 'address',
    submit: 'submit',
    review: 'submit',
  };
  const resolved = aliases[normalized];
  if (!resolved || !isVerificationDeepLinkStep(resolved)) return null;
  const order: VerificationDeepLinkStep[] = [
    'personal_details',
    'phone',
    'id_document',
    'address',
    'submit',
  ];
  return order.indexOf(resolved);
}

/** Map listing `?step=` slug → generic listing form index (0–4). */
export function listingFormStepIndex(step: string | null | undefined): number | null {
  if (!step) return null;
  const normalized = step.trim().toLowerCase();
  const aliases: Record<string, ListingDeepLinkStep> = {
    details: 'details',
    title: 'details',
    pricing: 'pricing',
    price: 'pricing',
    delivery: 'delivery',
    pickup: 'delivery',
    photos: 'photos',
    images: 'photos',
    review: 'review',
  };
  const resolved = aliases[normalized];
  if (!resolved || !isListingDeepLinkStep(resolved)) return null;
  const order: ListingDeepLinkStep[] = ['details', 'pricing', 'delivery', 'photos', 'review'];
  return order.indexOf(resolved);
}

/** Map listing `?step=` slug → vehicle listing form index. */
export function vehicleListingFormStepIndex(step: string | null | undefined): number | null {
  if (!step) return null;
  const normalized = step.trim().toLowerCase();
  if (normalized === 'photos' || normalized === 'images') return 5;
  if (normalized === 'review') return 6;
  if (normalized === 'pricing' || normalized === 'price' || normalized === 'delivery' || normalized === 'pickup') {
    return 4;
  }
  if (normalized === 'details' || normalized === 'title' || normalized === 'overview') return 0;
  return listingFormStepIndex(step);
}
