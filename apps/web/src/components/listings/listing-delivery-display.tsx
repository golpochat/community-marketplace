'use client';

import type { ListingDeliverySelection } from '@community-marketplace/types';

import {
  deliverySectionTitle,
  formatDeliveryOptionLabel,
  formatDeliveryOptionPrice,
  sanitizeDeliveryOptionsForDisplay,
} from '@/lib/delivery-display';

interface ListingDeliveryDisplayProps {
  options?: ListingDeliverySelection[];
  /** Override auto title (`Collection` vs `Delivery`). */
  title?: string;
  /** Renders as a simple list without an outer card — for use inside sidebar panels. */
  inline?: boolean;
}

export function ListingDeliveryDisplay({
  options = [],
  title,
  inline = false,
}: ListingDeliveryDisplayProps) {
  const sanitized = sanitizeDeliveryOptionsForDisplay(options);
  if (sanitized.length === 0) return null;

  const heading = title ?? deliverySectionTitle(sanitized);
  const collectionOnly = sanitized.every((option) => option.zone === 'COLLECTION');

  const list = (
    <ul className={inline ? 'space-y-1.5' : 'mt-3 space-y-2'}>
      {sanitized.map((option) => {
        const label = formatDeliveryOptionLabel(option);
        const priceLabel = formatDeliveryOptionPrice(option);

        return (
          <li
            key={`${option.deliveryOptionId}-${option.customLabel ?? option.label}`}
            className="flex items-center justify-between gap-3 text-sm text-foreground"
          >
            <span>{collectionOnly && sanitized.length === 1 ? 'Collect from seller' : label}</span>
            {priceLabel && <span className="shrink-0 font-medium text-foreground">{priceLabel}</span>}
          </li>
        );
      })}
    </ul>
  );

  if (inline) {
    return (
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{heading}</p>
        {list}
      </div>
    );
  }

  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-brand-sm">
      <h2 className="text-base font-semibold text-foreground">{heading}</h2>
      {list}
    </section>
  );
}
