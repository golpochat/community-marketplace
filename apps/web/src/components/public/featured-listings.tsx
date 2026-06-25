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
    <section className="bg-[hsl(var(--brand-neutral))] py-12">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-h2 text-gray-900">Featured listings</h2>
            <p className="mt-1 text-small text-gray-600">Recently added items from your community</p>
          </div>
          <Link href="/listings">
            <Button variant="ghost" size="sm" className="shrink-0">
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
