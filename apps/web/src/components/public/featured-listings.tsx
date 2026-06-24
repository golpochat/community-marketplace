import Link from 'next/link';

import { Button } from '@community-marketplace/ui';
import type { ListingSummary } from '@community-marketplace/types';

import { ListingCard } from '@/components/listings/listing-card';

interface FeaturedListingsProps {
  listings: ListingSummary[];
}

export function FeaturedListings({ listings }: FeaturedListingsProps) {
  const items = Array.isArray(listings) ? listings : [];
  if (items.length === 0) return null;

  return (
    <section className="bg-gray-50 py-12">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Featured listings</h2>
          <Link href="/listings">
            <Button variant="ghost" size="sm">
              View all →
            </Button>
          </Link>
        </div>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.slice(0, 6).map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </div>
    </section>
  );
}
