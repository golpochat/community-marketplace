'use client';

import { useEffect, useMemo, useState } from 'react';
import { notFound } from 'next/navigation';

import type { ListingSummary, SellerStorefront } from '@community-marketplace/types';

import { StoreHeader } from '@/components/storefront/store-header';
import { StoreDescription } from '@/components/storefront/store-description';
import { StoreSectionTabs } from '@/components/storefront/store-section-tabs';
import { StoreListingGrid } from '@/components/storefront/store-listing-grid';
import { StoreReviewList } from '@/components/storefront/store-review-list';
import { StorePolicySection } from '@/components/storefront/store-policy-section';
import { Skeleton } from '@/components/shared/skeleton';
import { storefrontService } from '@/services/storefront.service';

interface StorefrontPageClientProps {
  sellerSlug: string;
}

export function StorefrontPageClient({ sellerSlug }: StorefrontPageClientProps) {
  const [store, setStore] = useState<SellerStorefront | null>(null);
  const [activeSectionId, setActiveSectionId] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void storefrontService.getBySlug(sellerSlug).then((data) => {
      setStore(data);
      setLoading(false);
    });
  }, [sellerSlug]);

  const filteredListings = useMemo((): ListingSummary[] => {
    if (!store) return [];
    if (activeSectionId === 'all') return store.listings;
    const section = store.sections.find((s) => s.id === activeSectionId);
    if (!section) return store.listings;
    return store.listings.filter((l) => section.listingIds.includes(l.id));
  }, [store, activeSectionId]);

  if (!loading && !store) notFound();

  if (loading || !store) {
    return (
      <div>
        <Skeleton className="h-56 w-full" />
        <div className="mx-auto max-w-6xl px-4 py-8">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="mt-4 h-32 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="pb-12">
      <StoreHeader store={store} />
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        <StoreDescription
          description={store.description}
          memberSince={store.memberSince}
          analytics={store.analytics}
        />
        <div>
          <StoreSectionTabs
            sections={store.sections}
            activeSectionId={activeSectionId}
            onChange={setActiveSectionId}
          />
          <StoreListingGrid listings={filteredListings} />
        </div>
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Reviews</h2>
            <StoreReviewList reviews={store.reviews} />
          </div>
          <StorePolicySection policies={store.policies} />
        </div>
      </div>
    </div>
  );
}
