'use client';

import { useMemo } from 'react';

import { BrandMediaImage } from '@community-marketplace/ui';

import {
  listingImageFallbackChain,
  listingSummaryImageFallbackChain,
  type ListingImageLike,
  type ListingImageVariant,
} from '@/lib/listing-image-url';

export interface ListingMediaImageProps {
  alt: string;
  variant?: ListingImageVariant;
  /** Full listing image with optional variant URLs (detail pages, seller forms). */
  image?: ListingImageLike | null;
  /** Summary cover URL from browse/feed APIs (`ListingSummary.imageUrl`). */
  imageUrl?: string | null;
  className?: string;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  fit?: 'cover' | 'contain';
}

/**
 * Standard listing photo renderer — resolves variant URLs correctly and falls back
 * through larger sizes when a crop is missing (e.g. card → full).
 */
export function ListingMediaImage({
  alt,
  variant = 'card',
  image,
  imageUrl,
  className,
  rounded = 'none',
  fit = 'cover',
}: ListingMediaImageProps) {
  const fallbacks = useMemo(() => {
    if (image) return listingImageFallbackChain(image, variant);
    return listingSummaryImageFallbackChain(imageUrl ?? undefined, variant);
  }, [image, imageUrl, variant]);

  return (
    <BrandMediaImage
      src={fallbacks[0]}
      fallbackSrcs={fallbacks.slice(1)}
      alt={alt}
      className={className}
      rounded={rounded}
      fit={fit}
    />
  );
}
