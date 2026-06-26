'use client';

import {
  BrowseViewToggle,
  type BrowseViewMode,
} from '@/components/listings/browse/browse-view-toggle';
import { StoreListingSort } from '@/components/storefront/store-listing-sort';
import type { StorefrontSort } from '@/services/storefront.service';

interface StoreListingsToolbarProps {
  sort: StorefrontSort;
  viewMode: BrowseViewMode;
  onSortChange: (sort: StorefrontSort) => void;
  onViewModeChange: (mode: BrowseViewMode) => void;
}

export function StoreListingsToolbar({
  sort,
  viewMode,
  onSortChange,
  onViewModeChange,
}: StoreListingsToolbarProps) {
  return (
    <div className="flex flex-wrap items-end gap-2 sm:justify-end">
      <BrowseViewToggle mode={viewMode} onChange={onViewModeChange} />
      <StoreListingSort value={sort} onChange={onSortChange} />
    </div>
  );
}
