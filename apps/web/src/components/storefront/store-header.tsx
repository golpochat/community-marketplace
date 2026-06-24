import type { SellerStorefront } from '@community-marketplace/types';

import { StoreBanner } from '@/components/storefront/store-banner';
import { StoreLogo } from '@/components/storefront/store-logo';

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
          <div className="pb-4">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{store.name}</h1>
              {store.verified && (
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                  Verified
                </span>
              )}
            </div>
            {store.tagline && <p className="mt-1 text-gray-600">{store.tagline}</p>}
            {store.location && <p className="mt-1 text-sm text-gray-500">{store.location}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
