'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { notFound, usePathname, useRouter, useSearchParams } from 'next/navigation';

import type { SellerStorefront, StorefrontListing } from '@community-marketplace/types';

import { useBrowseViewMode } from '@/components/listings/browse/browse-view-preferences';
import { StoreDetailsSection } from '@/components/storefront/store-details-section';
import { StoreHeader } from '@/components/storefront/store-header';
import { StoreListingGrid } from '@/components/storefront/store-listing-grid';
import { StoreListingsToolbar } from '@/components/storefront/store-listings-toolbar';
import { StoreReviewList } from '@/components/storefront/store-review-list';
import { StoreSectionTabs } from '@/components/storefront/store-section-tabs';
import { StoreUnavailable } from '@/components/storefront/store-unavailable';
import { Skeleton } from '@/components/shared/skeleton';
import {
  storefrontService,
  type StorefrontSort,
} from '@/services/storefront.service';

interface StorefrontPageClientProps {
  sellerSlug: string;
}

function resolveSectionIdFromParam(
  param: string | null,
  sections: SellerStorefront['sections'],
): string {
  if (!param || param === 'all') return 'all';
  const match = sections.find((section) => section.slug === param || section.id === param);
  return match?.id ?? 'all';
}

function StorefrontSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 pb-24 lg:pb-12">
      <Skeleton className="h-44 w-full rounded-none sm:h-52 md:h-60" />
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <div className="flex gap-4">
          <Skeleton className="h-24 w-24 shrink-0 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-20 rounded-brand-md" />
          ))}
        </div>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,17rem)_minmax(0,1fr)]">
          <Skeleton className="h-64 rounded-brand-md" />
          <Skeleton className="h-96 rounded-brand-md" />
        </div>
      </div>
    </div>
  );
}

export function StorefrontPageClient({ sellerSlug }: StorefrontPageClientProps) {
  return (
    <Suspense fallback={<StorefrontSkeleton />}>
      <StorefrontPageClientContent sellerSlug={sellerSlug} />
    </Suspense>
  );
}

function StorefrontPageClientContent({ sellerSlug }: StorefrontPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [store, setStore] = useState<SellerStorefront | null>(null);
  const [listings, setListings] = useState<StorefrontListing[]>([]);
  const [sort, setSort] = useState<StorefrontSort>('newest');
  const [activeSectionId, setActiveSectionId] = useState('all');
  const [viewMode, setViewMode] = useBrowseViewMode();
  const [loading, setLoading] = useState(true);
  const [listingsLoading, setListingsLoading] = useState(false);
  const skipInitialListingFetch = useRef(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void storefrontService.getBySlug(sellerSlug).then((data) => {
      if (cancelled) return;
      setStore(data);
      setListings(data?.listings ?? []);
      if (data?.sections) {
        setActiveSectionId(resolveSectionIdFromParam(searchParams.get('section'), data.sections));
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [sellerSlug]);

  useEffect(() => {
    if (!store?.sections.length) return;
    setActiveSectionId(resolveSectionIdFromParam(searchParams.get('section'), store.sections));
  }, [searchParams, store?.sections]);

  const handleSectionChange = useCallback(
    (sectionId: string) => {
      setActiveSectionId(sectionId);
      const params = new URLSearchParams(searchParams.toString());
      if (sectionId === 'all') {
        params.delete('section');
      } else {
        const section = store?.sections.find((item) => item.id === sectionId);
        if (section) params.set('section', section.slug);
      }
      router.replace(params.size > 0 ? `${pathname}?${params.toString()}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams, store?.sections],
  );

  const loadListings = useCallback(
    async (nextSort: StorefrontSort) => {
      if (!store?.available) return;
      setListingsLoading(true);
      try {
        const result = await storefrontService.getListings(sellerSlug, nextSort);
        setListings(result.data);
      } finally {
        setListingsLoading(false);
      }
    },
    [sellerSlug, store?.available],
  );

  useEffect(() => {
    if (!store?.available || loading) return;
    if (skipInitialListingFetch.current && sort === 'newest') {
      skipInitialListingFetch.current = false;
      return;
    }
    void loadListings(sort);
  }, [sort, store?.available, loading, loadListings]);

  const filteredListings = useMemo(() => {
    if (activeSectionId === 'all') return listings;
    return listings.filter((listing) => listing.categoryId === activeSectionId);
  }, [activeSectionId, listings]);

  const activeSection = store?.sections.find((section) => section.id === activeSectionId);

  if (!loading && !store) notFound();

  if (loading || !store) {
    return <StorefrontSkeleton />;
  }

  if (store.available === false) {
    return <StoreUnavailable message={store.unavailableMessage} />;
  }

  const listingLabel =
    filteredListings.length === 1 ? '1 item' : `${filteredListings.length} items`;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 lg:pb-12">
      <StoreHeader store={store} listingCount={listings.length} />

      <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] lg:gap-10">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <StoreDetailsSection
              description={store.description}
              memberSince={store.memberSince}
              analytics={store.analytics}
              policies={store.policies}
              verified={store.verified}
              contact={store.contact}
              openingHours={store.openingHours}
            />
          </aside>

          <div className="min-w-0 space-y-10">
            <section aria-labelledby="store-listings-heading">
              <div className="mb-4 flex flex-col gap-4 border-b border-gray-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h2 id="store-listings-heading" className="text-xl font-bold text-gray-900">
                    {activeSection ? activeSection.name : 'Shop all listings'}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">{listingLabel} available</p>
                </div>
                <StoreListingsToolbar
                  sort={sort}
                  viewMode={viewMode}
                  onSortChange={setSort}
                  onViewModeChange={setViewMode}
                />
              </div>

              {store.sections.length > 0 ? (
                <div className="mb-6 overflow-x-auto">
                  <StoreSectionTabs
                    sections={store.sections}
                    activeSectionId={activeSectionId}
                    onChange={handleSectionChange}
                  />
                </div>
              ) : null}

              <StoreListingGrid
                listings={filteredListings}
                loading={listingsLoading}
                viewMode={viewMode}
              />
            </section>

            <section aria-labelledby="store-reviews-heading">
              <div className="mb-5 border-b border-gray-200 pb-4">
                <h2 id="store-reviews-heading" className="text-xl font-bold text-gray-900">
                  Customer reviews
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {store.analytics.reviewCount > 0
                    ? `${store.analytics.reviewCount} verified review${store.analytics.reviewCount === 1 ? '' : 's'}`
                    : 'Reviews from buyers on SellNearby'}
                </p>
              </div>
              <StoreReviewList reviews={store.reviews} />
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
