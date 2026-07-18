'use client';

import { cn } from '@community-marketplace/ui';
import { Award, ShieldCheck } from 'lucide-react';

import { ListingBadge } from '@/components/listings/listing-badge';
import { VerifiedSellerIcon } from '@/components/trust/verified-seller-icon';
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
  memberSince,
  soldCount = 0,
  averageRating,
  reviewCount = 0,
  isAmbassador,
  variant = 'full',
  className,
}: SellerTrustBadgesProps) {
  const badges: Array<{
    key: string;
    label: string;
    tone: 'trusted' | 'gold' | 'outline';
    icon?: React.ReactNode;
  }> = [];

  if (isNewMember(memberSince)) {
    badges.push({ key: 'new-member', label: 'New member', tone: 'outline' });
  }
  if (isTrustedSeller(averageRating, reviewCount)) {
    badges.push({
      key: 'trusted',
      label: variant === 'compact' ? 'Trusted' : 'Trusted seller',
      tone: 'trusted',
      icon: <ShieldCheck className="h-3.5 w-3.5" aria-hidden />,
    });
  }
  if (isTopSeller(soldCount)) {
    badges.push({
      key: 'top',
      label: 'Top seller',
      tone: 'gold',
      icon: <Award className="h-3.5 w-3.5" aria-hidden />,
    });
  }
  if (isAmbassador) {
    badges.push({ key: 'ambassador', label: 'Community ambassador', tone: 'trusted' });
  }

  if (!verified && badges.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {verified ? <VerifiedSellerIcon size={variant === 'compact' ? 'sm' : 'md'} /> : null}
      {badges.map((badge) => (
        <ListingBadge key={badge.key} tone={badge.tone} className="font-normal">
          {badge.icon}
          {badge.label}
        </ListingBadge>
      ))}
    </div>
  );
}
