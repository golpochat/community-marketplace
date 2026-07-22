'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

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
import {
  hasActiveFilters,
  resetBrowseFilters,
} from '@/components/listings/browse/browse-filter-constants';
import { ListingCard } from '@/components/listings/listing-card';
import { DisplayAdsClient } from '@/components/ads/display-ads-client';
import { EmptyState } from '@/components/shared/empty-state';
import { Pagination } from '@/components/shared/pagination';
import { ListingCardListSkeleton, ListingCardSkeleton } from '@/components/shared/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { BROWSE_RESULTS_GRID_CLASS, BROWSE_RESULTS_LIST_CLASS } from '@/lib/listing-browse-layout';
import { SITE_PAGE_CLASS } from '@/lib/page-layout';
import { Button } from '@community-marketplace/ui';
import { buyerService } from '@/services/marketplace.service';
import { listingsService } from '@/services/listings.service';

const GRID_CLASS = BROWSE_RESULTS_GRID_CLASS;
const LIST_CLASS = BROWSE_RESULTS_LIST_CLASS;

interface ListingsBrowseClientProps {
  initialCategories?: Category[];
  initialListings?: ListingSummary[];
  initialMeta?: { page: number; limit: number; total: number };
  initialFiltersKey?: string;
  pageTitle?: string;
  pageDescription?: string;
  /** Ad serve context: browse (sidebar + inline) or category (sidebar). */
  adsContext?: 'browse' | 'category' | 'search';
}

export function ListingsBrowseClient({
  initialCategories,
  initialListings,
  initialMeta,
  initialFiltersKey,
  pageTitle,
  pageDescription,
  adsContext = 'browse',
}: ListingsBrowseClientProps = {}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [viewMode, setViewMode] = useBrowseViewMode();
  const { isAuthenticated, user } = useAuth();
  const [categories, setCategories] = useState<Category[]>(initialCategories ?? []);
  const [listings, setListings] = useState<ListingSummary[]>(initialListings ?? []);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(!initialListings);
  const [meta, setMeta] = useState(initialMeta ?? { page: 1, limit: 12, total: 0 });
  const loadedKeyRef = useRef<string | null>(initialFiltersKey ?? null);

  const filters = parseBrowseFiltersFromParams(searchParams);
  const paramsKey = searchParams.toString();

  const load = useCallback(async () => {
    setLoading(true);
    const [cats, result] = await Promise.all([
      listingsService.getCategories(),
      listingsService.search(filters),
    ]);
    setCategories(cats);

    let merged = result.data;
    if (filters.categoryId) {
      const categoryFeatured = await listingsService.getFeatured({
        placement: 'category',
        categoryId: filters.categoryId,
        limit: 8,
      });
      if (categoryFeatured.length > 0) {
        const featuredIds = new Set(categoryFeatured.map((listing) => listing.id));
        merged = [
          ...categoryFeatured,
          ...result.data.filter((listing) => !featuredIds.has(listing.id)),
        ];
      }
    }

    setListings(merged);
    setMeta(result.meta);

    if (isAuthenticated && user?.role === 'BUYER' && merged.length > 0) {
      const favorites = await buyerService.getFavorites(1, 100);
      setSavedIds(new Set(favorites.data.map((listing) => listing.id)));
    } else {
      setSavedIds(new Set());
    }

    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- filters derived from paramsKey
  }, [paramsKey, isAuthenticated, user?.role]);

  useEffect(() => {
    if (loadedKeyRef.current === paramsKey) return;
    loadedKeyRef.current = paramsKey;
    void load();
  }, [load, paramsKey]);

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
    <div className={SITE_PAGE_CLASS}>
      <header className="mb-6 space-y-1">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          {pageTitle ?? 'Browse listings'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {pageDescription ?? 'Discover items from trusted sellers in your community'}
        </p>
      </header>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="hidden w-full shrink-0 lg:block lg:w-72 xl:w-80">
          <div className="sticky top-4 max-h-[calc(100vh-2rem)] space-y-4 overflow-y-auto">
            <div className="rounded-xl border border-border bg-card p-3 shadow-brand-sm">
              <BrowseFilterSidebar
                categories={categories}
                filters={filters}
                onChange={updateFilters}
              />
            </div>
          <DisplayAdsClient
            context={adsContext}
            placement="category_sidebar"
            className="overflow-hidden rounded-xl lg:block"
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

          {/* Mobile: show sidebar creative above results when desktop column is hidden */}
          <div className="flex justify-center lg:hidden">
            <DisplayAdsClient
              context={adsContext}
              placement="category_sidebar"
              className="overflow-hidden"
            />
          </div>

          <DisplayAdsClient
            context={adsContext === 'category' ? 'browse' : adsContext}
            placement="search_results_inline"
            className="overflow-hidden"
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
                  <ListingCardListSkeleton key={i} />
                ))}
              </div>
            )
          ) : listings.length === 0 ? (
            <EmptyState
              title="No listings found"
              description="Try adjusting your filters or search terms."
              action={
                hasActiveFilters(filters) ? (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => updateFilters(resetBrowseFilters(filters.limit))}
                  >
                    Clear filters
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className={viewMode === 'list' ? LIST_CLASS : GRID_CLASS}>
              {listings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  layout={viewMode === 'list' ? 'list' : 'grid'}
                  showSave={showSave}
                  initialSaved={savedIds.has(listing.id)}
                  showTrust={false}
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
