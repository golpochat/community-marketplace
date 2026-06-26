'use client';

import { cn } from '@community-marketplace/ui';
import { Star } from 'lucide-react';

interface SellerRatingDisplayProps {
  averageRating?: number;
  reviewCount?: number;
  size?: 'sm' | 'md';
  className?: string;
}

export function SellerRatingDisplay({
  averageRating,
  reviewCount = 0,
  size = 'sm',
  className,
}: SellerRatingDisplayProps) {
  if (reviewCount > 0 && averageRating != null) {
    return (
      <p
        className={cn(
          'inline-flex items-center gap-1 text-gray-600',
          size === 'sm' ? 'text-xs' : 'text-sm',
          className,
        )}
      >
        <Star className={cn('fill-amber-400 text-amber-400', size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4')} aria-hidden />
        <span className="font-medium text-gray-800">{averageRating.toFixed(1)}</span>
        <span className="text-gray-500">
          ({reviewCount} review{reviewCount === 1 ? '' : 's'})
        </span>
      </p>
    );
  }

  return (
    <p className={cn('text-gray-400', size === 'sm' ? 'text-xs' : 'text-sm', className)}>
      No reviews yet
    </p>
  );
}
