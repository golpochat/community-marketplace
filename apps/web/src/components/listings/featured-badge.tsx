import { Star } from 'lucide-react';

import { cn } from '@community-marketplace/ui';

import { ListingBadge } from '@/components/listings/listing-badge';

interface FeaturedBadgeProps {
  featuredUntil?: string;
  isFeatured?: boolean;
  className?: string;
}

export function isListingFeatured(
  featuredUntil?: string | null,
  isFeatured?: boolean,
  now = Date.now(),
): boolean {
  if (isFeatured === true) return true;
  if (!featuredUntil) return false;
  return new Date(featuredUntil).getTime() > now;
}

export function FeaturedBadge({
  featuredUntil,
  isFeatured,
  className = '',
}: FeaturedBadgeProps) {
  if (!isListingFeatured(featuredUntil, isFeatured)) return null;

  return (
    <ListingBadge
      tone="featured"
      className={cn('shrink-0 font-normal', className)}
      title="Featured listing"
    >
      <Star className="h-3 w-3" aria-hidden />
      Featured
    </ListingBadge>
  );
}
