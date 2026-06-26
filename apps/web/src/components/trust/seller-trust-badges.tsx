'use client';

import { cn } from '@community-marketplace/ui';
import { Award, BadgeCheck, ShieldCheck } from 'lucide-react';

import { ListingBadge } from '@/components/listings/listing-badge';
import {
  isNewMember,
  isTopSeller,
  isTrustedSeller,
  type SellerTrustInput,
} from '@/lib/trust-helpers';

interface SellerTrustBadgesProps extends SellerTrustInput {
  variant?: 'compact' | 'full';
  className?: string;
}

export function SellerTrustBadges({
  verified,
  phoneVerified,
  memberSince,
  soldCount = 0,
  averageRating,
  reviewCount = 0,
  isAmbassador,
  variant = 'full',
  className,
}: SellerTrustBadgesProps) {
  const badges: Array<{ key: string; label: string; tone: 'verified' | 'trusted' | 'gold' | 'outline'; icon?: React.ReactNode }> = [];

  if (isNewMember(memberSince)) {
    badges.push({ key: 'new-member', label: 'New member', tone: 'outline' });
  }
  if (verified) {
    badges.push({
      key: 'verified',
      label: variant === 'compact' ? 'Verified' : 'Verified seller',
      tone: 'verified',
      icon: <BadgeCheck className="h-3 w-3" aria-hidden />,
    });
  }
  if (isTrustedSeller(averageRating, reviewCount)) {
    badges.push({
      key: 'trusted',
      label: variant === 'compact' ? 'Trusted' : 'Trusted seller',
      tone: 'trusted',
      icon: <ShieldCheck className="h-3 w-3" aria-hidden />,
    });
  }
  if (isTopSeller(soldCount)) {
    badges.push({
      key: 'top',
      label: variant === 'compact' ? 'Top seller' : 'Top seller',
      tone: 'gold',
      icon: <Award className="h-3 w-3" aria-hidden />,
    });
  }
  if (isAmbassador) {
    badges.push({ key: 'ambassador', label: 'Community ambassador', tone: 'trusted' });
  }

  if (badges.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {badges.map((badge) => (
        <ListingBadge key={badge.key} tone={badge.tone} className="font-normal">
          {badge.icon}
          {badge.label}
        </ListingBadge>
      ))}
    </div>
  );
}
