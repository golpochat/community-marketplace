'use client';

import type { ListingDeliverySelection } from '@community-marketplace/types';
import { formatCurrency } from '@community-marketplace/utils';
import { Package } from 'lucide-react';

import { ListingBadge } from '@/components/listings/listing-badge';

interface ListingDeliveryBadgesProps {
  options: ListingDeliverySelection[];
  className?: string;
}

export function ListingDeliveryBadges({ options, className }: ListingDeliveryBadgesProps) {
  if (options.length === 0) return null;

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const label = option.label ?? option.customLabel ?? 'Delivery';
          const priceLabel =
            option.price != null && option.price > 0
              ? formatCurrency(option.price, 'EUR')
              : option.zone === 'COLLECTION'
                ? null
                : 'Free';

          return (
            <ListingBadge key={`${option.deliveryOptionId}-${label}`} tone="outline" className="font-normal">
              <Package className="h-3 w-3 shrink-0" aria-hidden />
              {priceLabel ? `${label}: ${priceLabel}` : label}
            </ListingBadge>
          );
        })}
      </div>
    </div>
  );
}
