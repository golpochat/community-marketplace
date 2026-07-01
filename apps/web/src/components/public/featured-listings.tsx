import Link from 'next/link';

import { Button } from '@community-marketplace/ui';
import type { ListingSummary } from '@community-marketplace/types';

import { ListingCard } from '@/components/listings/listing-card';

interface FeaturedListingsProps {
  listings: ListingSummary[];
  isPromoted?: boolean;
}

export function FeaturedListings({ listings, isPromoted = false }: FeaturedListingsProps) {
  const items = Array.isArray(listings) ? listings : [];
  if (items.length === 0) return null;

  return (
    <section className="py-14 md:px-6">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <h2 className="text-section-title">Featured listings</h2>
            <p className="text-body mt-2">
              {isPromoted
                ? 'Seller-promoted picks with premium homepage placement'
                : 'Recently added items from your community'}
            </p>
          </div>
          <Link href="/listings">
            <Button variant="outline" size="sm" className="shrink-0 border-primary/30 bg-card">
              View all listings →
            </Button>
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.slice(0, 8).map((listing) => (
            <ListingCard key={listing.id} listing={listing} showTrust={false} />
          ))}
        </div>
      </div>
    </section>
  );
}
