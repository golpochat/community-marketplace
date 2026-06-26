import type { ListingSummary } from '@community-marketplace/types';

import { ListingCard } from '@/components/listings/listing-card';

interface SimilarListingsProps {
  listings: ListingSummary[];
}

export function SimilarListings({ listings }: SimilarListingsProps) {
  if (listings.length === 0) return null;

  return (
    <section className="mt-12 border-t border-gray-100 pt-8">
      <h2 className="text-xl font-semibold text-gray-900">Similar cars you might like</h2>
      <p className="mt-1 text-sm text-gray-500">Browse more listings in this category</p>
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {listings.slice(0, 4).map((listing) => (
          <ListingCard key={listing.id} listing={listing} imageVariant="thumb" compact />
        ))}
      </div>
    </section>
  );
}
