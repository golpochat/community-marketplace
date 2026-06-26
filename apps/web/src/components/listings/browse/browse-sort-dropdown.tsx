'use client';

import { Select } from '@community-marketplace/ui';
import type { Category, ListingSearchFilters, ListingSortOption } from '@community-marketplace/types';

import { getSortOptionsForCategory } from '@/components/listings/browse/browse-filter-constants';

interface BrowseSortDropdownProps {
  categories: Category[];
  filters: ListingSearchFilters;
  onChange: (filters: ListingSearchFilters) => void;
  className?: string;
}

export function BrowseSortDropdown({
  categories,
  filters,
  onChange,
  className,
}: BrowseSortDropdownProps) {
  const options = getSortOptionsForCategory(categories, filters.categoryId);

  return (
    <Select
      value={filters.sort ?? 'newest'}
      onChange={(e) =>
        onChange({ ...filters, sort: e.target.value as ListingSortOption, page: 1 })
      }
      aria-label="Sort listings"
      className={className}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} disabled={opt.disabled}>
          {opt.label}
        </option>
      ))}
    </Select>
  );
}
