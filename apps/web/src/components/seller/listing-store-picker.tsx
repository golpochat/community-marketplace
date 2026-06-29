'use client';

import Link from 'next/link';

import type { SellerStore } from '@community-marketplace/types';
import { Label, Select } from '@community-marketplace/ui';

export function pickDefaultListingStoreId(stores: SellerStore[]): string {
  if (!stores.length) return '';
  return stores.find((store) => store.isPrimary)?.id ?? stores[0]?.id ?? '';
}

interface ListingStorePickerProps {
  stores: SellerStore[];
  value: string;
  onChange: (storeId: string) => void;
  disabled?: boolean;
}

export function ListingStorePicker({
  stores,
  value,
  onChange,
  disabled,
}: ListingStorePickerProps) {
  if (stores.length <= 1) return null;

  return (
    <div>
      <Label htmlFor="listing-store">Storefront</Label>
      <Select
        id="listing-store"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="mt-1"
      >
        {stores.map((store) => (
          <option key={store.id} value={store.id}>
            {store.name}
            {store.isPrimary ? ' (primary)' : ''}
          </option>
        ))}
      </Select>
      <p className="mt-1 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
        This listing will appear on the selected storefront&apos;s public page.
      </p>
    </div>
  );
}

export function ListingStoreRequiredNotice() {
  return (
    <p className="text-sm text-amber-700">
      Create a{' '}
      <Link href="/seller/storefront" className="font-medium underline">
        storefront
      </Link>{' '}
      before adding listings.
    </p>
  );
}
