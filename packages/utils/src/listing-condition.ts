import type { ListingCondition } from '@community-marketplace/types';

export const LISTING_CONDITION_LABELS: Record<ListingCondition, string> = {
  new: 'New',
  like_new: 'Like New',
  good: 'Good',
  fair: 'Fair',
  poor: 'Needs Work',
};

export function formatListingConditionLabel(
  condition?: ListingCondition | string | null,
): string | undefined {
  if (!condition) return undefined;
  const key = condition as ListingCondition;
  return LISTING_CONDITION_LABELS[key] ?? condition.replace(/_/g, ' ');
}
