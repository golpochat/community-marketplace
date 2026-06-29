'use client';

import Link from 'next/link';

import type { SellerStore } from '@community-marketplace/types';
import { Label, Select } from '@community-marketplace/ui';

export type SellerCategoryOption = {
  id: string;
  name: string;
  slug?: string;
};

const FIELD_HINT_CLASS = 'mt-1 text-xs text-[hsl(var(--dashboard-sidebar-muted))]';
const READONLY_VALUE_CLASS =
  'mt-1 flex min-h-[2.5rem] w-full items-center rounded-md border border-[hsl(var(--dashboard-sidebar-border))] bg-white px-3 py-2 text-sm text-[hsl(var(--dashboard-main-fg))]';

export function pickDefaultListingStoreId(stores: SellerStore[]): string {
  if (!stores.length) return '';
  return stores.find((store) => store.isPrimary)?.id ?? stores[0]?.id ?? '';
}

function ReadonlyContextField({
  id,
  label,
  value,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div id={id} className={READONLY_VALUE_CLASS}>
        {value}
      </div>
      {hint ? <p className={FIELD_HINT_CLASS}>{hint}</p> : null}
    </div>
  );
}

interface ListingCreateContextProps {
  stores: SellerStore[];
  storesLoading?: boolean;
  storeId: string;
  onStoreIdChange: (storeId: string) => void;
  categories: SellerCategoryOption[];
  categoryId: string;
  onCategoryIdChange: (categoryId: string) => void;
  isVehicle: boolean;
  disabled?: boolean;
}

export function ListingCreateContext({
  stores,
  storesLoading,
  storeId,
  onStoreIdChange,
  categories,
  categoryId,
  onCategoryIdChange,
  isVehicle,
  disabled,
}: ListingCreateContextProps) {
  const selectedStore = stores.find((store) => store.id === storeId);
  const selectedCategory = categories.find((category) => category.id === categoryId);
  const formHint = isVehicle
    ? 'Vehicle listings use the structured step-by-step form below.'
    : 'Standard listings use the general item form below.';

  if (storesLoading) {
    return (
      <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">Loading storefronts…</p>
    );
  }

  if (stores.length === 0) {
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

  const showStorePicker = stores.length > 1;
  const showCategoryPicker = categories.length > 1;

  return (
    <section
      className="rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] bg-[hsl(var(--dashboard-sidebar-active))]/40 p-4 sm:p-5"
      aria-label="Listing context"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {showStorePicker ? (
          <div>
            <Label htmlFor="listing-store">Storefront</Label>
            <Select
              id="listing-store"
              value={storeId}
              onChange={(event) => onStoreIdChange(event.target.value)}
              disabled={disabled}
              className="mt-1 w-full"
            >
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                  {store.isPrimary ? ' (primary)' : ''}
                </option>
              ))}
            </Select>
            <p className={FIELD_HINT_CLASS}>
              This listing will appear on the selected storefront&apos;s public page.
            </p>
          </div>
        ) : (
          <ReadonlyContextField
            id="listing-store-readonly"
            label="Storefront"
            value={
              selectedStore
                ? `${selectedStore.name}${selectedStore.isPrimary ? ' (primary)' : ''}`
                : '—'
            }
            hint="This listing will appear on your storefront's public page."
          />
        )}

        {categories.length > 0 &&
          (showCategoryPicker ? (
            <div>
              <Label htmlFor="listing-category">Category</Label>
              <Select
                id="listing-category"
                value={categoryId}
                onChange={(event) => onCategoryIdChange(event.target.value)}
                disabled={disabled}
                className="mt-1 w-full"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
              <p className={FIELD_HINT_CLASS}>{formHint}</p>
            </div>
          ) : (
            <ReadonlyContextField
              id="listing-category-readonly"
              label="Category"
              value={selectedCategory?.name ?? '—'}
              hint={formHint}
            />
          ))}
      </div>
    </section>
  );
}
