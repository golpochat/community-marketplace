'use client';

import { useState } from 'react';

import { Button, Input, Select } from '@community-marketplace/ui';
import type { Category, ListingCondition, ListingSearchFilters, ListingSortOption } from '@community-marketplace/types';

interface FilterBarProps {
  categories: Category[];
  filters: ListingSearchFilters;
  onChange: (filters: ListingSearchFilters) => void;
}

const SORT_OPTIONS: { value: ListingSortOption; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_low_to_high', label: 'Price: Low to High' },
  { value: 'price_high_to_low', label: 'Price: High to Low' },
];

const CONDITION_OPTIONS: { value: ListingCondition; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'like_new', label: 'Like New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
];

function FilterFields({
  categories,
  filters,
  onChange,
}: FilterBarProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <Input
        placeholder="Search listings..."
        value={filters.q ?? ''}
        onChange={(e) => onChange({ ...filters, q: e.target.value || undefined })}
      />
      <Select
        value={filters.categoryId ?? ''}
        onChange={(e) => onChange({ ...filters, categoryId: e.target.value || undefined })}
      >
        <option value="">All categories</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
          </option>
        ))}
      </Select>
      <Select
        value={filters.condition ?? ''}
        onChange={(e) =>
          onChange({ ...filters, condition: (e.target.value as ListingCondition) || undefined })
        }
      >
        <option value="">Any condition</option>
        {CONDITION_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Select>
      <Input
        type="number"
        placeholder="Min price"
        value={filters.minPrice ?? ''}
        onChange={(e) =>
          onChange({ ...filters, minPrice: e.target.value ? Number(e.target.value) : undefined })
        }
      />
      <Select
        value={filters.sort ?? 'newest'}
        onChange={(e) => onChange({ ...filters, sort: e.target.value as ListingSortOption })}
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Select>
    </div>
  );
}

export function FilterBar(props: FilterBarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <div className="hidden rounded-xl border border-gray-200 bg-white p-4 lg:block">
        <FilterFields {...props} />
      </div>

      <div className="lg:hidden">
        <Button variant="outline" className="w-full" onClick={() => setMobileOpen(true)}>
          Filters &amp; sort
        </Button>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <button
              type="button"
              className="absolute inset-0 bg-black/50"
              aria-label="Close filters"
              onClick={() => setMobileOpen(false)}
            />
            <div className="relative max-h-[80vh] overflow-y-auto rounded-t-2xl bg-white p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Filters</h3>
                <Button variant="ghost" size="sm" onClick={() => setMobileOpen(false)}>
                  Close
                </Button>
              </div>
              <FilterFields {...props} />
              <Button className="mt-6 w-full" onClick={() => setMobileOpen(false)}>
                Apply filters
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
