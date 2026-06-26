import type { SellerStorefront } from '@community-marketplace/types';

import { StoreBanner } from '@/components/storefront/store-banner';
import { StoreLogo } from '@/components/storefront/store-logo';
import { SellerTrustBadges } from '@/components/trust/seller-trust-badges';
import { SellerRatingDisplay } from '@/components/trust/seller-rating-display';

interface StoreHeaderProps {
  store: SellerStorefront;
}

export function StoreHeader({ store }: StoreHeaderProps) {
  return (
    <div className="relative">
      <StoreBanner bannerUrl={store.bannerUrl} name={store.name} />
      <div className="mx-auto max-w-6xl px-4">
        <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
          <StoreLogo logoUrl={store.logoUrl} name={store.name} />
          <div className="space-y-2 pb-4">
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{store.name}</h1>
            {store.tagline && <p className="text-gray-600">{store.tagline}</p>}
            {store.location && <p className="text-sm text-gray-500">{store.location}</p>}
            <SellerRatingDisplay
              averageRating={store.analytics.averageRating}
              reviewCount={store.analytics.reviewCount}
              size="md"
            />
            <SellerTrustBadges
              verified={store.verified}
              memberSince={store.memberSince}
              soldCount={store.analytics.totalSales}
              averageRating={store.analytics.averageRating}
              reviewCount={store.analytics.reviewCount}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
