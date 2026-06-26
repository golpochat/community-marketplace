import type { ListingSummary } from '@community-marketplace/types';

import { ListingCard } from '@/components/listings/listing-card';
import { EmptyState } from '@/components/shared/empty-state';

interface StoreListingGridProps {
  listings: ListingSummary[];
}

export function StoreListingGrid({ listings }: StoreListingGridProps) {
  if (listings.length === 0) {
    return <EmptyState title="No listings" description="This store has no items in this section." />;
  }

  return (
    <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} showTrustCues={false} />
      ))}
    </div>
  );
}
