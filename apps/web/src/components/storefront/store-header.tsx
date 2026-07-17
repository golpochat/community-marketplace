'use client';

import type { SellerStorefront } from '@community-marketplace/types';
import { MapPin, MessageCircle } from 'lucide-react';

import { SellerRatingDisplay } from '@/components/trust/seller-rating-display';

import { StoreBanner } from '@/components/storefront/store-banner';
import { StoreContactButton } from '@/components/storefront/store-contact-button';
import {
  STOREFRONT_CONTAINER_CLASS,
  STOREFRONT_LOGO_OVERLAP_CLASS,
} from '@/components/storefront/storefront-layout';
import { StoreLogo } from '@/components/storefront/store-logo';
import { StoreStatsStrip } from '@/components/storefront/store-stats-strip';
import { StoreVerificationLabel } from '@/components/storefront/store-verification-label';

interface StoreHeaderProps {
  store: SellerStorefront;
  listingCount: number;
}

export function StoreHeader({ store, listingCount }: StoreHeaderProps) {
  const joinedLabel = store.memberSince
    ? new Date(store.memberSince).toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <header className="border-b border-border bg-card">
      <StoreBanner bannerUrl={store.bannerUrl} name={store.name} />

      <div className={STOREFRONT_CONTAINER_CLASS}>
        <div className="pb-6 pt-0">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-5">
              <StoreLogo
                logoUrl={store.logoUrl}
                name={store.name}
                className={STOREFRONT_LOGO_OVERLAP_CLASS}
              />
              <div className="min-w-0 space-y-2 pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    {store.name}
                  </h1>
                  <StoreVerificationLabel
                    sellerStatus={store.sellerStatus}
                    verified={store.verified}
                  />
                </div>
                {store.tagline?.trim() ? (
                  <p className="max-w-xl text-sm text-muted-foreground sm:text-base">{store.tagline}</p>
                ) : null}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  {joinedLabel ? <span>Joined {joinedLabel}</span> : null}
                  {store.location ? (
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-brand-600" aria-hidden />
                      {store.location}
                    </span>
                  ) : null}
                  <SellerRatingDisplay
                    averageRating={store.analytics.averageRating}
                    reviewCount={store.analytics.reviewCount}
                    size="md"
                  />
                </div>
              </div>
            </div>

            <div className="hidden shrink-0 pb-1 lg:block">
              <StoreContactButton
                sellerId={store.sellerId}
                listingId={store.contactListingId}
                className="min-w-[11rem]"
              />
            </div>
          </div>
        </div>

        <div className="pb-6 md:pb-8">
          <StoreStatsStrip
            listingCount={listingCount}
            analytics={store.analytics}
            memberSince={store.memberSince}
          />
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white/95 p-3 shadow-lg backdrop-blur-sm lg:hidden">
        <StoreContactButton
          sellerId={store.sellerId}
          listingId={store.contactListingId}
          icon={<MessageCircle className="h-4 w-4" aria-hidden />}
          label="Message seller"
        />
      </div>
    </header>
  );
}
