'use client';

import type { StorefrontSort } from '@/services/storefront.service';
import { Select } from '@community-marketplace/ui';

const SORT_OPTIONS: Array<{ value: StorefrontSort; label: string }> = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_low_to_high', label: 'Price: Low → High' },
  { value: 'price_high_to_low', label: 'Price: High → Low' },
];

interface StoreListingSortProps {
  value: StorefrontSort;
  onChange: (value: StorefrontSort) => void;
}

export function StoreListingSort({ value, onChange }: StoreListingSortProps) {
  return (
    <div className="flex w-full flex-col gap-1.5 sm:w-auto sm:items-end">
      <label htmlFor="store-listing-sort" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Sort by
      </label>
      <Select
        id="store-listing-sort"
        value={value}
        onChange={(e) => onChange(e.target.value as StorefrontSort)}
        aria-label="Sort listings"
        className="w-full min-w-[12rem] rounded-brand-md border-border bg-card shadow-brand-sm sm:w-auto"
      >
      {SORT_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
      </Select>
    </div>
  );
}
