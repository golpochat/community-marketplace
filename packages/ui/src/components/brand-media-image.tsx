'use client';

import * as React from 'react';

import { cn } from '../lib/utils';
import { BRAND_ICON_MARK_SUBTLE, resolveImageSrc } from '../lib/brand-media';

export interface BrandMediaImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  fit?: 'cover' | 'contain';
}

const roundedClasses = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  full: 'rounded-full',
} as const;

function BrandMediaPlaceholder({
  alt,
  className,
  rounded,
}: {
  alt: string;
  className?: string;
  rounded: NonNullable<BrandMediaImageProps['rounded']>;
}) {
  return (
    <div
      className={cn(
        'flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,rgba(13,148,136,0.12)_0%,rgba(15,118,110,0.08)_100%)]',
        roundedClasses[rounded],
        className,
      )}
      aria-label={alt}
      role="img"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={BRAND_ICON_MARK_SUBTLE}
        alt=""
        aria-hidden
        className="h-[38%] w-[38%] max-h-16 max-w-16 object-contain opacity-80"
      />
      <span className="sr-only">{alt}</span>
    </div>
  );
}

export function BrandMediaImage({
  src,
  alt,
  className,
  rounded = 'md',
  fit = 'cover',
}: BrandMediaImageProps) {
  const resolvedSrc = resolveImageSrc(src);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    setFailed(false);
  }, [resolvedSrc]);

  if (!resolvedSrc || failed) {
    return <BrandMediaPlaceholder alt={alt} className={className} rounded={rounded} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolvedSrc}
      alt={alt}
      className={cn(
        'h-full w-full',
        fit === 'cover' ? 'object-cover' : 'object-contain',
        roundedClasses[rounded],
        className,
      )}
      onError={() => setFailed(true)}
    />
  );
}
