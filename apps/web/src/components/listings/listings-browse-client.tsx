'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import type { Category, ListingSearchFilters, ListingSummary } from '@community-marketplace/types';

import { BrowseFilterSidebar } from '@/components/listings/browse/browse-filter-sidebar';
import { BrowseListingsToolbar } from '@/components/listings/browse/browse-listings-toolbar';
import { BrowseMobileFilterDrawer } from '@/components/listings/browse/browse-mobile-filter-drawer';
import { LocalBrowseBar } from '@/components/local/local-browse-bar';
import { useBrowseViewMode } from '@/components/listings/browse/browse-view-preferences';
import {
  clearCategorySpecificFilters,
  parseBrowseFiltersFromParams,
  serializeBrowseFilters,
} from '@/components/listings/browse/browse-url-filters';
import { ListingCard } from '@/components/listings/listing-card';
import { ListingCardList } from '@/components/listings/listing-card-list';
import { EmptyState } from '@/components/shared/empty-state';
import { Pagination } from '@/components/shared/pagination';
import { ListingCardSkeleton } from '@/components/shared/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { buyerService } from '@/services/marketplace.service';
import { listingsService } from '@/services/listings.service';

const GRID_CLASS =
  'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4';

const LIST_CLASS = 'flex flex-col gap-4';

export function ListingsBrowseClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [viewMode, setViewMode] = useBrowseViewMode();
  const { isAuthenticated, user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [listings, setListings] = useState<ListingSummary[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ page: 1, limit: 12, total: 0 });

  const filters = parseBrowseFiltersFromParams(searchParams);
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
    const prevCategoryId = filters.categoryId;
    let resolved = next;
    if (next.categoryId !== prevCategoryId) {
      resolved = clearCategorySpecificFilters(next);
    }
    router.push(`/listings?${serializeBrowseFilters(resolved).toString()}`);
  }

  const totalPages = Math.max(1, Math.ceil(meta.total / meta.limit));
  const showSave = isAuthenticated && user?.role === 'BUYER';

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
      <header className="mb-6 space-y-1">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Browse listings</h1>
        <p className="text-sm text-gray-500">
          Discover items from trusted sellers in your community
        </p>
      </header>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="hidden w-full shrink-0 lg:block lg:w-72 xl:w-80">
          <div className="sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto rounded-xl border border-gray-200 bg-white p-4 shadow-brand-sm">
            <BrowseFilterSidebar
              categories={categories}
              filters={filters}
              onChange={updateFilters}
            />
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-4">
          <LocalBrowseBar filters={filters} onFiltersChange={updateFilters} />

          <BrowseMobileFilterDrawer
            categories={categories}
            filters={filters}
            onChange={updateFilters}
          />

          <BrowseListingsToolbar
            categories={categories}
            filters={filters}
            total={meta.total}
            loading={loading}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onChange={updateFilters}
          />

          {loading ? (
            viewMode === 'grid' ? (
              <div className={GRID_CLASS}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <ListingCardSkeleton key={i} />
                ))}
              </div>
            ) : (
              <div className={LIST_CLASS}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <ListingCardSkeleton key={i} />
                ))}
              </div>
            )
          ) : listings.length === 0 ? (
            <EmptyState
              title="No listings found"
              description="Try adjusting your filters or search terms."
            />
          ) : viewMode === 'list' ? (
            <div className={LIST_CLASS}>
              {listings.map((listing) => (
                <ListingCardList
                  key={listing.id}
                  listing={listing}
                  showSave={showSave}
                  initialSaved={savedIds.has(listing.id)}
                />
              ))}
            </div>
          ) : (
            <div className={GRID_CLASS}>
              {listings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  showSave={showSave}
                  initialSaved={savedIds.has(listing.id)}
                />
              ))}
            </div>
          )}

          <Pagination
            className="mt-8"
            page={meta.page}
            totalPages={totalPages}
            total={meta.total}
            limit={meta.limit}
            onPageChange={(page) => updateFilters({ ...filters, page })}
          />
        </div>
      </div>
    </div>
  );
}
