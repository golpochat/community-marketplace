'use client';

import { useEffect, useState } from 'react';

import type { ListingSummary } from '@community-marketplace/types';
import { PageHeader } from '@community-marketplace/ui-dashboard';

import { ListingCard } from '@/components/listings/listing-card';
import { EmptyState } from '@/components/shared/empty-state';
import { ListingCardSkeleton } from '@/components/shared/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { listingsService } from '@/services/listings.service';
import { buyerService } from '@/services/marketplace.service';

export default function BuyerListingsPage() {
  const { isAuthenticated, user } = useAuth();
  const [listings, setListings] = useState<ListingSummary[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const result = await listingsService.getAll(1, 12);
      setListings(result.data);

      if (isAuthenticated && user?.role === 'BUYER') {
        try {
          const favorites = await buyerService.getFavorites(1, 100);
          setFavoriteIds(new Set(favorites.data.map((item) => item.id)));
        } catch {
          setFavoriteIds(new Set());
        }
      }

      setLoading(false);
    }
    void load();
  }, [isAuthenticated, user?.role]);

  return (
    <>
      <PageHeader
        title="Browse Listings"
        description="Discover items from sellers near you."
      />
      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {listings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              showSave={user?.role === 'BUYER'}
              initialSaved={favoriteIds.has(listing.id)}
            />
          ))}
        </div>
      )}
    </>
  );
}
