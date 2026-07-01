'use client';

import type { ListingSummary } from '@community-marketplace/types';

import { ListingCard } from '@/components/listings/listing-card';
import { isVehicleCategory } from '@/lib/vehicle-catalog';

interface SimilarListingsProps {
  listings: ListingSummary[];
  categoryName?: string;
  categorySlug?: string;
  /** When true, limits columns for the narrow main column on detail pages. */
  narrow?: boolean;
}

function resolveHeading(categoryName?: string, categorySlug?: string): string {
  if (categoryName) {
    if (isVehicleCategory({ slug: categorySlug, name: categoryName })) {
      return `Similar ${categoryName.toLowerCase()} you might like`;
    }
    return `More in ${categoryName}`;
  }
  return 'Similar listings you might like';
}

export function SimilarListings({
  listings,
  categoryName,
  categorySlug,
  narrow = false,
}: SimilarListingsProps) {
  if (listings.length === 0) return null;

  const heading = resolveHeading(categoryName, categorySlug);
  const gridClass = narrow
    ? 'mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2'
    : 'mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4';

  return (
    <section className="mt-12 border-t border-border pt-8">
      <h2 className="text-xl font-semibold text-foreground">{heading}</h2>
      <p className="mt-1 text-sm text-muted-foreground">Browse more listings in this category</p>
      <div className={gridClass}>
        {listings.slice(0, 4).map((listing) => (
          <ListingCard key={listing.id} listing={listing} layout="compact" showTrust={false} />
        ))}
      </div>
    </section>
  );
}
