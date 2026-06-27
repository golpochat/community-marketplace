import { TrendingUp } from 'lucide-react';

import { cn } from '@community-marketplace/ui';

import { ListingBadge } from '@/components/listings/listing-badge';

interface BoostedBadgeProps {
  boostedUntil?: string;
  className?: string;
}

export function isListingBoosted(boostedUntil?: string | null, now = Date.now()): boolean {
  if (!boostedUntil) return false;
  return new Date(boostedUntil).getTime() > now;
}

export function BoostedBadge({ boostedUntil, className = '' }: BoostedBadgeProps) {
  if (!isListingBoosted(boostedUntil)) return null;

  return (
    <ListingBadge
      tone="boosted"
      className={cn('shrink-0 font-normal', className)}
      title="Promoted in search results"
    >
      <TrendingUp className="h-3 w-3" aria-hidden />
      Boosted
    </ListingBadge>
  );
}
