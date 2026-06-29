'use client';

import { cn } from '@community-marketplace/ui';

interface StoreBannerPhotoProps {
  src: string;
  className?: string;
}

/** Hero banners are pre-processed to 4:1 on upload — always fill edge-to-edge. */
export function StoreBannerPhoto({ src, className }: StoreBannerPhotoProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      aria-hidden
      className={cn('absolute inset-0 h-full w-full object-cover object-center', className)}
    />
  );
}
