'use client';

import { useCallback, useEffect, useState } from 'react';

import type { ListingImage } from '@community-marketplace/types';
import { cn } from '@community-marketplace/ui';

import { SaleBadgeOverlay } from '@/components/listings/sale-badge-overlay';
import { resolveListingImageSrc } from '@/lib/listing-image-url';

interface GalleryProps {
  images: ListingImage[];
  title: string;
  originalPrice?: number;
  salePrice?: number;
  discountPercent?: number;
}

function GalleryImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [resolvedSrc, setResolvedSrc] = useState(() => resolveListingImageSrc(src));

  useEffect(() => {
    setResolvedSrc(resolveListingImageSrc(src));
  }, [src]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolvedSrc}
      alt={alt}
      className={className}
      onError={() => {
        if (resolvedSrc.includes('_retry=')) return;
        const separator = resolvedSrc.includes('?') ? '&' : '?';
        setResolvedSrc(`${resolvedSrc}${separator}_retry=${Date.now()}`);
      }}
    />
  );
}

export function Gallery({
  images,
  title,
  originalPrice,
  salePrice,
  discountPercent,
}: GalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const slides = images.length > 0 ? images : [];

  const goNext = useCallback(() => {
    if (slides.length <= 1) return;
    setActiveIndex((i) => (i + 1) % slides.length);
  }, [slides.length]);

  const goPrev = useCallback(() => {
    if (slides.length <= 1) return;
    setActiveIndex((i) => (i - 1 + slides.length) % slides.length);
  }, [slides.length]);

  function handleTouchStart(e: React.TouchEvent) {
    setTouchStart(e.touches[0]?.clientX ?? null);
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStart == null) return;
    const diff = touchStart - (e.changedTouches[0]?.clientX ?? touchStart);
    if (Math.abs(diff) > 50) {
      if (diff > 0) goNext();
      else goPrev();
    }
    setTouchStart(null);
  }

  useEffect(() => {
    setActiveIndex(0);
  }, [images]);

  if (slides.length === 0) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-xl bg-gray-100 text-gray-400">
        No images
      </div>
    );
  }

  const active = slides[activeIndex]!;

  return (
    <div className="space-y-3">
      <div
        className="relative aspect-[4/3] overflow-hidden rounded-xl bg-gray-100"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <GalleryImage src={active.url} alt={title} className="h-full w-full object-cover" />
        <SaleBadgeOverlay
          originalPrice={originalPrice}
          salePrice={salePrice}
          discountPercent={discountPercent}
          size="lg"
        />
        {slides.length > 1 && (
          <>
            <button
              type="button"
              onClick={goPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 px-3 py-2 text-white"
              aria-label="Previous image"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={goNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 px-3 py-2 text-white"
              aria-label="Next image"
            >
              ›
            </button>
            <span className="absolute bottom-2 right-2 rounded-full bg-black/50 px-2 py-1 text-xs text-white">
              {activeIndex + 1} / {slides.length}
            </span>
          </>
        )}
      </div>
      {slides.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {slides.map((img, idx) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={cn(
                'h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2',
                idx === activeIndex ? 'border-primary' : 'border-transparent',
              )}
            >
              <GalleryImage src={img.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
