'use client';

import type { ListingDeliverySelection } from '@community-marketplace/types';

import {
  formatDeliveryOptionLabel,
  formatDeliveryOptionPrice,
} from '@/lib/delivery-display';

interface ListingDeliveryDisplayProps {
  options?: ListingDeliverySelection[];
  title?: string;
  /** Renders as a simple list without an outer card — for use inside sidebar panels. */
  inline?: boolean;
}

export function ListingDeliveryDisplay({
  options = [],
  title = 'Delivery',
  inline = false,
}: ListingDeliveryDisplayProps) {
  if (options.length === 0) return null;

  const list = (
    <ul className={inline ? 'space-y-1.5' : 'mt-3 space-y-2'}>
      {options.map((option) => {
        const label = formatDeliveryOptionLabel(option);
        const priceLabel = formatDeliveryOptionPrice(option);

        return (
          <li
            key={`${option.deliveryOptionId}-${option.customLabel ?? option.label}`}
            className="flex items-center justify-between gap-3 text-sm text-gray-700"
          >
            <span>{label}</span>
            {priceLabel && <span className="shrink-0 font-medium text-gray-900">{priceLabel}</span>}
          </li>
        );
      })}
    </ul>
  );

  if (inline) {
    return (
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{title}</p>
        {list}
      </div>
    );
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-brand-sm">
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      {list}
    </section>
  );
}
