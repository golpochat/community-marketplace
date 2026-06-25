'use client';

import type { ListingDeliverySelection } from '@community-marketplace/types';
import { formatCurrency } from '@community-marketplace/utils';

interface ListingDeliveryDisplayProps {
  options?: ListingDeliverySelection[];
  title?: string;
}

export function ListingDeliveryDisplay({
  options = [],
  title = 'Delivery options',
}: ListingDeliveryDisplayProps) {
  if (options.length === 0) return null;

  return (
    <section className="mt-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      <ul className="mt-3 space-y-2">
        {options.map((option) => (
          <li
            key={`${option.deliveryOptionId}-${option.customLabel ?? option.label}`}
            className="flex items-center justify-between text-sm text-gray-700"
          >
            <span>{option.label}</span>
            <span className="font-medium text-gray-900">
              {option.price != null ? formatCurrency(option.price, 'EUR') : 'Free'}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
