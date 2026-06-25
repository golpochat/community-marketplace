'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import type { Category, ListingSearchFilters, ListingSummary } from '@community-marketplace/types';
import { formatCurrency } from '@community-marketplace/utils';

import { FilterBar } from '@/components/listings/filter-bar';
import { ListingCard } from '@/components/listings/listing-card';
import { EmptyState } from '@/components/shared/empty-state';
import { Pagination } from '@/components/shared/pagination';
import { ListingCardSkeleton } from '@/components/shared/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { buyerService } from '@/services/marketplace.service';
import { listingsService } from '@/services/listings.service';

export function ListingsBrowseClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [listings, setListings] = useState<ListingSummary[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ page: 1, limit: 12, total: 0 });

  const filters: ListingSearchFilters = {
    q: searchParams.get('q') ?? undefined,
    categoryId: searchParams.get('categoryId') ?? undefined,
    condition: (searchParams.get('condition') as ListingSearchFilters['condition']) ?? undefined,
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    sort: (searchParams.get('sort') as ListingSearchFilters['sort']) ?? 'newest',
    page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
    limit: 12,
  };

  const paramsKey = searchParams.toString();

  const load = useCallback(async () => {
    setLoading(true);
    const [cats, result] = await Promise.all([
      listingsService.getCategories(),
      listingsService.search(filters),
    ]);
    setCategories(cats);
    setListings(result.data);
    setMeta(result.meta);

    if (isAuthenticated && user?.role === 'BUYER' && result.data.length > 0) {
      const favorites = await buyerService.getFavorites(1, 100);
      setSavedIds(new Set(favorites.data.map((listing) => listing.id)));
    } else {
      setSavedIds(new Set());
    }

    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- filters derived from paramsKey
  }, [paramsKey, isAuthenticated, user?.role]);

  useEffect(() => {
    void load();
  }, [load]);

  function updateFilters(next: ListingSearchFilters) {
    const params = new URLSearchParams();
    if (next.q) params.set('q', next.q);
    if (next.categoryId) params.set('categoryId', next.categoryId);
    if (next.condition) params.set('condition', next.condition);
    if (next.minPrice != null) params.set('minPrice', String(next.minPrice));
    if (next.sort) params.set('sort', next.sort);
    if (next.page && next.page > 1) params.set('page', String(next.page));
    router.push(`/listings?${params.toString()}`);
  }

  const totalPages = Math.max(1, Math.ceil(meta.total / meta.limit));
  const minPrice = listings.length > 0 ? Math.min(...listings.map((l) => l.price)) : 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-gray-900">Browse Listings</h1>
      <p className="mt-2 text-gray-600">
        {meta.total} items{listings.length > 0 ? ` — from ${formatCurrency(minPrice)}` : ''}
      </p>

      <div className="mt-6">
        <FilterBar categories={categories} filters={filters} onChange={updateFilters} />
      </div>

      {loading ? (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ListingCardSkeleton key={i} />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <EmptyState
          className="mt-8"
          title="No listings found"
          description="Try adjusting your filters or search terms."
        />
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              showSave={isAuthenticated && user?.role === 'BUYER'}
              initialSaved={savedIds.has(listing.id)}
            />
          ))}
        </div>
      )}

      <Pagination
        className="mt-8"
        page={meta.page}
        totalPages={totalPages}
        onPageChange={(page) => updateFilters({ ...filters, page })}
      />
    </div>
  );
}
