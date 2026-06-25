'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import { Card } from '@community-marketplace/ui-dashboard';

import { DashboardPageShell } from '@/components/dashboard/async-resource';
import { ListingCard } from '@/components/listings/listing-card';
import { buyerService } from '@/services/marketplace.service';

export function BuyerFavoritesPage() {
  const [favorites, setFavorites] = useState<Awaited<ReturnType<typeof buyerService.getFavorites>>['data']>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void buyerService
      .getFavorites(1, 24)
      .then((result) => {
        if (!cancelled) setFavorites(result.data);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <DashboardPageShell
      title="Favorites"
      description="Listings you have saved."
      loading={loading}
      error={error}
      empty={!loading && !error && favorites.length === 0}
      emptyTitle="No favorites yet"
      emptyDescription="Save listings while browsing to find them here."
    >
      <Card>
        <div className="mb-4 flex justify-end">
          <Link
            href="/buyer/listings"
            className="text-sm font-medium text-[hsl(var(--dashboard-accent))] hover:underline"
          >
            Browse listings
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
        {favorites.length > 0 && (
          <p className="mt-4 text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
            {favorites.length} saved listing{favorites.length === 1 ? '' : 's'}
          </p>
        )}
      </Card>
    </DashboardPageShell>
  );
}
