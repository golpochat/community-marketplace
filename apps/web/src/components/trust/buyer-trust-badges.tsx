'use client';

import { cn } from '@community-marketplace/ui';
import { BadgeCheck, ShieldCheck, Users } from 'lucide-react';

import { ListingBadge } from '@/components/listings/listing-badge';
import { isSafeBuyer, type BuyerTrustInput } from '@/lib/trust-helpers';
import { SellerRatingDisplay } from '@/components/trust/seller-rating-display';

interface BuyerTrustBadgesProps extends BuyerTrustInput {
  showRating?: boolean;
  className?: string;
}

export function BuyerTrustBadges({
  phoneVerified,
  completedTransactions = 0,
  hasDisputes,
  isCommunityMember,
  averageRating,
  reviewCount = 0,
  showRating = true,
  className,
}: BuyerTrustBadgesProps) {
  const badges: Array<{ key: string; label: string; tone: 'verified' | 'trusted' | 'community' }> = [];

  if (phoneVerified) {
    badges.push({ key: 'verified', label: 'Verified buyer', tone: 'verified' });
  }
  if (isSafeBuyer(completedTransactions, hasDisputes)) {
    badges.push({ key: 'safe', label: 'Safe buyer', tone: 'trusted' });
  }
  if (isCommunityMember) {
    badges.push({ key: 'community', label: 'Community member', tone: 'community' });
  }

  if (badges.length === 0 && !showRating) return null;

  return (
    <div className={cn('space-y-2', className)}>
      {badges.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {badges.map((badge) => (
            <ListingBadge key={badge.key} tone={badge.tone} className="font-normal">
              {badge.key === 'verified' && <BadgeCheck className="h-3 w-3" aria-hidden />}
              {badge.key === 'safe' && <ShieldCheck className="h-3 w-3" aria-hidden />}
              {badge.key === 'community' && <Users className="h-3 w-3" aria-hidden />}
              {badge.label}
            </ListingBadge>
          ))}
        </div>
      )}
      {showRating && (
        <SellerRatingDisplay averageRating={averageRating} reviewCount={reviewCount} size="sm" />
      )}
    </div>
  );
}
