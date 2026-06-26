'use client';

import type { Category, ListingSearchFilters } from '@community-marketplace/types';

import { ActiveFilterChips } from '@/components/listings/browse/active-filter-chips';
import { BrowseSortDropdown } from '@/components/listings/browse/browse-sort-dropdown';
import { BrowseViewToggle, type BrowseViewMode } from '@/components/listings/browse/browse-view-toggle';

interface BrowseListingsToolbarProps {
  categories: Category[];
  filters: ListingSearchFilters;
  total: number;
  loading?: boolean;
  viewMode: BrowseViewMode;
  onViewModeChange: (mode: BrowseViewMode) => void;
  onChange: (filters: ListingSearchFilters) => void;
}

export function BrowseListingsToolbar({
  categories,
  filters,
  total,
  loading,
  viewMode,
  onViewModeChange,
  onChange,
}: BrowseListingsToolbarProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-600">
          {loading ? 'Loading…' : `Showing ${total.toLocaleString()} result${total === 1 ? '' : 's'}`}
        </p>
        <div className="flex items-center gap-2">
          <BrowseViewToggle mode={viewMode} onChange={onViewModeChange} />
          <BrowseSortDropdown
            categories={categories}
            filters={filters}
            onChange={onChange}
            className="min-w-[180px]"
          />
        </div>
      </div>

      <ActiveFilterChips categories={categories} filters={filters} onChange={onChange} />
    </div>
  );
}
