import type { ListingDeliverySelection } from '@community-marketplace/types';

export function buildDeliverySummaryLabel(
  options: Pick<ListingDeliverySelection, 'zone'>[] = [],
): string {
  if (options.length === 0) return 'Collection only';

  const zones = new Set(options.map((option) => option.zone).filter(Boolean));
  const hasCollection = zones.has('COLLECTION');
  const hasDelivery =
    zones.has('LOCAL') || zones.has('NATIONAL') || zones.has('CUSTOM');

  if (hasCollection && hasDelivery) return 'Delivery & collection';
  if (hasDelivery) return 'Delivery available';
  return 'Collection only';
}
