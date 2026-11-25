/** Shared preset causes for listing reject / remove dialogs. */
export const LISTING_MODERATION_REASON_OTHER = 'Other';

export const LISTING_REJECT_REASON_PRESETS = [
  'Duplicate listing',
  'Prohibited or restricted item',
  'Misleading title or description',
  'Poor or missing photos',
  'Incomplete or incorrect details',
  'Unrealistic price / possible scam',
  'Wrong category or location',
  LISTING_MODERATION_REASON_OTHER,
] as const;

export const LISTING_REMOVE_REASON_PRESETS = [
  'Policy violation',
  'Prohibited or restricted item',
  'Fraud or scam concern',
  'Duplicate listing',
  'Seller requested removal',
  'Legal / rights request',
  LISTING_MODERATION_REASON_OTHER,
] as const;

export type ListingRejectReasonPreset = (typeof LISTING_REJECT_REASON_PRESETS)[number];
export type ListingRemoveReasonPreset = (typeof LISTING_REMOVE_REASON_PRESETS)[number];

/** Combines a preset label with optional free-text detail for the seller. */
export function composeModerationReason(preset: string, detail: string): string {
  const trimmedPreset = preset.trim();
  const trimmedDetail = detail.trim();
  if (!trimmedPreset) return trimmedDetail;
  if (trimmedPreset === LISTING_MODERATION_REASON_OTHER) return trimmedDetail;
  if (!trimmedDetail) return trimmedPreset;
  return `${trimmedPreset} — ${trimmedDetail}`;
}
