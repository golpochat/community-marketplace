'use client';

import { useEffect, useState } from 'react';

import type { ListingSummary } from '@community-marketplace/types';
import { PageHeader } from '@community-marketplace/ui-dashboard';

import { ListingCard } from '@/components/listings/listing-card';
import { EmptyState } from '@/components/shared/empty-state';
import { ListingCardSkeleton } from '@/components/shared/skeleton';
import { listingsService } from '@/services/listings.service';

export default function BuyerListingsPage() {
  const [listings, setListings] = useState<ListingSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void listingsService.getAll(1, 12).then((result) => {
      setListings(result.data);
      setLoading(false);
    });
  }, []);

  return (
    <>
      <PageHeader
        title="Browse Listings"
        description="Discover items from sellers near you."
      />
      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ListingCardSkeleton key={i} />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <EmptyState
          variant="dashboard"
          title="No listings"
          description="Check back soon for new items."
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </>
  );
}
