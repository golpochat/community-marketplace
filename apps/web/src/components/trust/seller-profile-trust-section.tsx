'use client';

import type { ListingSellerSummary } from '@community-marketplace/types';

import { SellerRatingDisplay } from '@/components/trust/seller-rating-display';
import { SellerTrustBadges } from '@/components/trust/seller-trust-badges';

interface SellerProfileTrustSectionProps {
  seller?: ListingSellerSummary;
  memberSince?: string;
}

export function SellerProfileTrustSection({ seller, memberSince }: SellerProfileTrustSectionProps) {
  if (!seller && !memberSince) return null;

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-brand-sm">
      <h2 className="text-lg font-semibold text-gray-900">Seller reputation</h2>
      <div className="mt-4 space-y-3">
        <SellerRatingDisplay
          averageRating={seller?.averageRating}
          reviewCount={seller?.reviewCount}
          size="md"
        />
        <SellerTrustBadges
          verified={seller?.verified}
          phoneVerified={seller?.phoneVerified}
          memberSince={memberSince ?? seller?.memberSince}
          soldCount={seller?.soldCount}
          averageRating={seller?.averageRating}
          reviewCount={seller?.reviewCount}
          isAmbassador={seller?.isAmbassador}
          isBusiness={seller?.isBusiness}
        />
        {typeof seller?.activeListingCount === 'number' && (
          <p className="text-sm text-gray-600">
            {seller.activeListingCount} active listing{seller.activeListingCount === 1 ? '' : 's'}
          </p>
        )}
        {typeof seller?.soldCount === 'number' && seller.soldCount > 0 && (
          <p className="text-sm text-gray-600">
            {seller.soldCount} successful sale{seller.soldCount === 1 ? '' : 's'}
          </p>
        )}
        {typeof seller?.responseRate === 'number' && (
          <p className="text-sm text-gray-600">
            Responds to {seller.responseRate}% of messages
            {typeof seller.responseTimeMinutes === 'number' && seller.responseTimeMinutes > 0
              ? ` · typically within ${seller.responseTimeMinutes} min`
              : ''}
          </p>
        )}
      </div>
    </section>
  );
}
