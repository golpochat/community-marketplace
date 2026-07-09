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

  STOREFRONT_CONTAINER_CLASS,

  STOREFRONT_HERO_BANNER_CLASS,

  STOREFRONT_LOGO_OVERLAP_CLASS,

  STOREFRONT_LOGO_SIZE_CLASS,

} from '@/components/storefront/storefront-layout';

import {

  storefrontService,

  type StorefrontSort,

} from '@/services/storefront.service';



interface StorefrontPageClientProps {
  sellerSlug: string;
  initialStore?: SellerStorefront | null;
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

    <div className="min-h-screen bg-muted/50 pb-24 lg:pb-12">

      <Skeleton className={`w-full rounded-none ${STOREFRONT_HERO_BANNER_CLASS}`} />

      <div className={`${STOREFRONT_CONTAINER_CLASS} space-y-6 pb-8 pt-0`}>

        <div className={`flex gap-4 ${STOREFRONT_LOGO_OVERLAP_CLASS}`}>

          <Skeleton className={`shrink-0 rounded-full ${STOREFRONT_LOGO_SIZE_CLASS}`} />

          <div className="flex-1 space-y-2 pb-1">

            <Skeleton className="h-8 w-48" />

            <Skeleton className="h-4 w-64" />

          </div>

        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">

          {Array.from({ length: 4 }).map((_, index) => (

            <Skeleton key={index} className="h-20 rounded-brand-md" />

          ))}

        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] lg:gap-10">

          <Skeleton className="h-64 rounded-brand-md" />

          <Skeleton className="h-96 rounded-brand-md" />

        </div>

      </div>

    </div>

  );

}



export function StorefrontPageClient({ sellerSlug, initialStore }: StorefrontPageClientProps) {

  return (

    <Suspense fallback={<StorefrontSkeleton />}>

      <StorefrontPageClientContent sellerSlug={sellerSlug} initialStore={initialStore} />

    </Suspense>

  );

}



function StorefrontPageClientContent({ sellerSlug, initialStore }: StorefrontPageClientProps) {

  const router = useRouter();

  const pathname = usePathname();

  const searchParams = useSearchParams();

  const [store, setStore] = useState<SellerStorefront | null>(initialStore ?? null);

  const [listings, setListings] = useState<StorefrontListing[]>(initialStore?.listings ?? []);

  const [sort, setSort] = useState<StorefrontSort>('newest');

  const [activeSectionId, setActiveSectionId] = useState('all');

  const [viewMode, setViewMode] = useBrowseViewMode();

  const [loading, setLoading] = useState(!initialStore);

  const [listingsLoading, setListingsLoading] = useState(false);

  const skipInitialListingFetch = useRef(Boolean(initialStore));



  useEffect(() => {

    if (initialStore) return;

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

  }, [sellerSlug, initialStore, searchParams]);



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

    <div className="min-h-screen bg-muted/50 pb-24 lg:pb-12">

      <StoreHeader store={store} listingCount={listings.length} />



      <div className={`${STOREFRONT_CONTAINER_CLASS} py-8 md:py-10`}>

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

              <div className="mb-4 flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-end lg:justify-between">

                <div>

                  <h2 id="store-listings-heading" className="text-xl font-bold text-foreground">

                    {activeSection ? activeSection.name : 'Shop all listings'}

                  </h2>

                  <p className="mt-1 text-sm text-muted-foreground">{listingLabel} available</p>

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

              <div className="mb-5 border-b border-border pb-4">

                <h2 id="store-reviews-heading" className="text-xl font-bold text-foreground">

                  Customer reviews

                </h2>

                <p className="mt-1 text-sm text-muted-foreground">

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


