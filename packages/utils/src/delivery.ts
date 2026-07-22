import type { ListingDeliverySelection } from '@community-marketplace/types';

export function buildDeliverySummaryLabel(
  options: Pick<ListingDeliverySelection, 'zone'>[] = [],
): string {
  if (options.length === 0) return 'Collection only';

  const zones = new Set(options.map((option) => option.zone).filter(Boolean));
  const hasCollection = zones.has('COLLECTION');
  const hasDelivery =
    zones.has('LOCAL') || zones.has('NATIONAL') || zones.has('CUSTOM');

  // Invalid combo (API forbids Collection + shipping) — prefer delivery for summaries
  if (hasCollection && hasDelivery) return 'Delivery available';
  if (hasDelivery) return 'Delivery available';
  return 'Collection only';
}

/**
 * Collection Only cannot combine with shipping (API rule). Dirty/legacy rows that
 * include both confuse buyers — prefer shipping options and drop COLLECTION.
 */
export function sanitizeDeliveryOptionsForDisplay<
  T extends Pick<ListingDeliverySelection, 'zone'>,
>(options: T[] = []): T[] {
  if (options.length === 0) return [];

  const shipping = options.filter((option) => option.zone !== 'COLLECTION');
  const collection = options.filter((option) => option.zone === 'COLLECTION');

  if (collection.length > 0 && shipping.length > 0) {
    return shipping;
  }

  return options;
}

export function deliverySectionTitle(
  options: Pick<ListingDeliverySelection, 'zone'>[] = [],
): string {
  const sanitized = sanitizeDeliveryOptionsForDisplay(options);
  if (sanitized.length === 0) return 'Fulfilment';
  if (sanitized.every((option) => option.zone === 'COLLECTION')) return 'Collection';
  return 'Delivery';
}
