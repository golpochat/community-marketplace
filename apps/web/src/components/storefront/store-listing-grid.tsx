import type { StorefrontListing } from '@community-marketplace/types';

import { ListingCard } from '@/components/listings/listing-card';
import { ListingCardList } from '@/components/listings/listing-card-list';
import type { BrowseViewMode } from '@/components/listings/browse/browse-view-toggle';
import { EmptyState } from '@/components/shared/empty-state';

interface StoreListingGridProps {
  listings: StorefrontListing[];
  loading?: boolean;
  viewMode?: BrowseViewMode;
}

const GRID_CLASS = 'grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3';
const LIST_CLASS = 'flex flex-col gap-4';

export function StoreListingGrid({
  listings,
  loading = false,
  viewMode = 'grid',
}: StoreListingGridProps) {
  if (loading) {
    return viewMode === 'grid' ? (
      <div className={GRID_CLASS}>
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-[380px] animate-pulse rounded-brand-md border border-gray-200 bg-gray-100"
          />
        ))}
      </div>
    ) : (
      <div className={LIST_CLASS}>
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-48 animate-pulse rounded-brand-md border border-gray-200 bg-gray-100"
          />
        ))}
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <EmptyState
        title="No listings right now"
        description="Check back soon — this seller may add new items."
      />
    );
  }

  if (viewMode === 'list') {
    return (
      <div className={LIST_CLASS}>
        {listings.map((listing) => (
          <ListingCardList key={listing.id} listing={listing} />
        ))}
      </div>
    );
  }

  return (
    <div className={GRID_CLASS}>
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} compact showTrustCues={false} />
      ))}
    </div>
  );
}
