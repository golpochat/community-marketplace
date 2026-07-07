'use client';

import * as React from 'react';

import { cn } from '../lib/utils';
import { BRAND_ICON_MARK, resolveImageSrc } from '../lib/brand-media';

const sizeClasses = {
  xs: 'h-7 w-7',
  sm: 'h-8 w-8',
  md: 'h-9 w-9',
  lg: 'h-10 w-10',
  xl: 'h-14 w-14',
  '2xl': 'h-20 w-20',
} as const;

const iconSizeClasses = {
  xs: 'h-3.5 w-3.5',
  sm: 'h-4 w-4',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
  xl: 'h-7 w-7',
  '2xl': 'h-9 w-9',
} as const;

export type BrandAvatarSize = keyof typeof sizeClasses;

export interface BrandAvatarProps {
  src?: string | null;
  alt?: string;
  size?: BrandAvatarSize;
  className?: string;
}

function BrandAvatarPlaceholder({
  alt,
  size,
  className,
}: {
  alt: string;
  size: BrandAvatarSize;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#0D9488] ring-1 ring-[#0D9488]/20',
        sizeClasses[size],
        className,
      )}
      aria-label={alt}
      role="img"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={BRAND_ICON_MARK}
        alt=""
        aria-hidden
        className={cn('object-contain brightness-0 invert', iconSizeClasses[size])}
      />
    </span>
  );
}

export function BrandAvatar({ src, alt = 'Profile photo', size = 'md', className }: BrandAvatarProps) {
  const resolvedSrc = resolveImageSrc(src);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    setFailed(false);
  }, [resolvedSrc]);

  if (!resolvedSrc || failed) {
    return <BrandAvatarPlaceholder alt={alt} size={size} className={className} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolvedSrc}
      alt={alt}
      className={cn('inline-flex shrink-0 rounded-full object-cover', sizeClasses[size], className)}
      onError={() => setFailed(true)}
    />
  );
}
