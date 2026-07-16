'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import type { ListingSummary } from '@community-marketplace/types';
import { Button } from '@community-marketplace/ui';

import { DashboardPageShell } from '@/components/dashboard/async-resource';
import { ListingCard } from '@/components/listings/listing-card';
import { buyerService } from '@/services/marketplace.service';

export function BuyerFavoritesPage() {
  const [favorites, setFavorites] = useState<ListingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await buyerService.getFavorites(1, 24);
      setFavorites(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load favorites');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleRemove(listingId: string) {
    setRemovingId(listingId);
    setError(null);
    try {
      await buyerService.removeFavorite(listingId);
      setFavorites((prev) => prev.filter((item) => item.id !== listingId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove favorite');
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <DashboardPageShell
      title="Favorites"
      description="Listings you have saved."
      loading={loading}
      error={error}
      empty={!loading && !error && favorites.length === 0}
      emptyTitle="No favorites yet"
      emptyDescription="Save listings while browsing to find them here."
      emptyAction={
        <Button asChild variant="secondary">
          <Link href="/listings">Browse listings</Link>
        </Button>
      }
    >
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {favorites.map((listing) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            initialSaved
            footer={
              <Button
                variant="outline"
                size="sm"
                disabled={removingId === listing.id}
                onClick={() => void handleRemove(listing.id)}
              >
                {removingId === listing.id ? 'Removing…' : 'Remove from favorites'}
              </Button>
            }
          />
        ))}
      </div>
      {favorites.length > 0 && (
        <p className="mt-4 text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
          {favorites.length} saved listing{favorites.length === 1 ? '' : 's'}
        </p>
      )}
    </DashboardPageShell>
  );
}
