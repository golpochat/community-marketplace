import type { StorefrontListing } from '@community-marketplace/types';

import { ListingCard } from '@/components/listings/listing-card';
import type { BrowseViewMode } from '@/components/listings/browse/browse-view-toggle';
import { EmptyState } from '@/components/shared/empty-state';
import { ListingCardListSkeleton, ListingCardSkeleton } from '@/components/shared/skeleton';
import { BROWSE_RESULTS_GRID_CLASS, BROWSE_RESULTS_LIST_CLASS } from '@/lib/listing-browse-layout';

interface StoreListingGridProps {
  listings: StorefrontListing[];
  loading?: boolean;
  viewMode?: BrowseViewMode;
}

export function StoreListingGrid({
  listings,
  loading = false,
  viewMode = 'grid',
}: StoreListingGridProps) {
  if (loading) {
    return viewMode === 'grid' ? (
      <div className={BROWSE_RESULTS_GRID_CLASS}>
        {Array.from({ length: 6 }).map((_, index) => (
          <ListingCardSkeleton key={index} />
        ))}
      </div>
    ) : (
      <div className={BROWSE_RESULTS_LIST_CLASS}>
        {Array.from({ length: 4 }).map((_, index) => (
          <ListingCardListSkeleton key={index} />
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

  return (
    <div className={viewMode === 'list' ? BROWSE_RESULTS_LIST_CLASS : BROWSE_RESULTS_GRID_CLASS}>
      {listings.map((listing) => (
        <ListingCard
          key={listing.id}
          listing={listing}
          layout={viewMode === 'list' ? 'list' : 'compact'}
          showTrust={false}
        />
      ))}
    </div>
  );
}
