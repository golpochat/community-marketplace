import type { ListingSummary } from '@community-marketplace/types';

import { ListingCard } from '@/components/listings/listing-card';

interface SimilarListingsProps {
  listings: ListingSummary[];
}

export function SimilarListings({ listings }: SimilarListingsProps) {
  if (listings.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="text-lg font-semibold text-gray-900">Similar listings</h2>
      <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {listings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </section>
  );
}
