'use client';

import { BuyerTrustBadges } from '@/components/trust/buyer-trust-badges';

interface BuyerProfileTrustSectionProps {
  phoneVerified?: boolean;
  completedTransactions?: number;
  isCommunityMember?: boolean;
  averageRating?: number;
  reviewCount?: number;
  memberSince?: string;
  visibleToSeller?: boolean;
}

export function BuyerProfileTrustSection({
  phoneVerified,
  completedTransactions,
  isCommunityMember,
  averageRating,
  reviewCount,
  memberSince,
  visibleToSeller = false,
}: BuyerProfileTrustSectionProps) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-brand-sm">
      <h2 className="text-lg font-semibold text-gray-900">Trust profile</h2>
      {visibleToSeller && (
        <p className="mt-1 text-xs text-gray-500">Visible to sellers only</p>
      )}
      <div className="mt-4 space-y-3">
        <BuyerTrustBadges
          phoneVerified={phoneVerified}
          completedTransactions={completedTransactions}
          isCommunityMember={isCommunityMember}
          averageRating={averageRating}
          reviewCount={reviewCount}
        />
        {memberSince && (
          <p className="text-sm text-gray-600">
            Member since{' '}
            {new Date(memberSince).toLocaleDateString(undefined, {
              month: 'long',
              year: 'numeric',
            })}
          </p>
        )}
        {typeof completedTransactions === 'number' && completedTransactions > 0 && (
          <p className="text-sm text-gray-600">
            {completedTransactions} completed transaction{completedTransactions === 1 ? '' : 's'}
          </p>
        )}
      </div>
    </section>
  );
}
