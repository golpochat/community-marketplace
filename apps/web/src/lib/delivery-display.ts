import type { ListingDeliverySelection } from '@community-marketplace/types';
import { formatCurrency } from '@community-marketplace/utils';

export function formatDeliveryOptionPrice(option: ListingDeliverySelection): string | null {
  if (option.zone === 'COLLECTION') return null;
  if (option.price == null || option.price <= 0) return 'Free';
  return formatCurrency(option.price, 'EUR');
}

export function formatDeliveryOptionLabel(option: ListingDeliverySelection): string {
  return option.label ?? option.customLabel ?? 'Delivery';
}
