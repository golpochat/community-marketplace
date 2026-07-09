'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import type { ListingImage } from '@community-marketplace/types';
import type { ListingImageVariant } from '@/lib/listing-image-url';
import { cn, BrandMediaImage } from '@community-marketplace/ui';
import { Check, ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';

import { ListingMediaImage } from '@/components/listings/listing-media-image';

const COVER_IMAGE_CLASS = 'absolute inset-0 h-full w-full object-cover';

interface GalleryImageProps {
  image: ListingImage;
  alt: string;
  variant: ListingImageVariant;
  className?: string;
}

function GalleryImage({ image, alt, variant, className }: GalleryImageProps) {
  return (
    <div className={cn('absolute inset-0', className)}>
      <ListingMediaImage image={image} variant={variant} alt={alt} className="h-full w-full" />
    </div>
  );
}

interface AspectMediaFrameProps {
  children: React.ReactNode;
  className?: string;
}

function AspectMediaFrame({ children, className }: AspectMediaFrameProps) {
  return (
    <div className={cn('relative aspect-video w-full overflow-hidden bg-muted', className)}>
      {children}
    </div>
  );
}

interface GalleryLightboxProps {
  images: ListingImage[];
  title: string;
  activeIndex: number;
  open: boolean;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

function GalleryLightbox({
  images,
  title,
  activeIndex,
  open,
  onClose,
  onIndexChange,
}: GalleryLightboxProps) {
  const goNext = useCallback(() => {
    if (images.length <= 1) return;
    onIndexChange((activeIndex + 1) % images.length);
  }, [activeIndex, images.length, onIndexChange]);

  const goPrev = useCallback(() => {
    if (images.length <= 1) return;
    onIndexChange((activeIndex - 1 + images.length) % images.length);
  }, [activeIndex, images.length, onIndexChange]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowRight') goNext();
      if (event.key === 'ArrowLeft') goPrev();
    }
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose, goNext, goPrev]);

  if (!open || typeof document === 'undefined') return null;

  const active = images[activeIndex];

  return createPortal(
    <div className="fixed inset-0 z-[60] flex flex-col bg-black/95">
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <p className="truncate text-sm font-medium">
          {title} · {activeIndex + 1} / {images.length}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-2 hover:bg-white/10"
          aria-label="Close gallery"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="relative flex flex-1 items-center justify-center px-4 pb-4">
        {images.length > 1 && (
          <button
            type="button"
            onClick={goPrev}
            className="absolute left-2 z-10 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 md:left-4"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        {active && (
          <AspectMediaFrame className="max-w-5xl rounded-lg">
            <GalleryImage image={active} alt={title} variant="full" className={COVER_IMAGE_CLASS} />
          </AspectMediaFrame>
        )}

        {images.length > 1 && (
          <button
            type="button"
            onClick={goNext}
            className="absolute right-2 z-10 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 md:right-4"
            aria-label="Next image"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto px-4 pb-4">
          {images.map((img, idx) => (
            <button
              key={img.id}
              type="button"
              onClick={() => onIndexChange(idx)}
              className={cn(
                'relative aspect-video w-20 shrink-0 overflow-hidden rounded-md border-2',
                idx === activeIndex ? 'border-white' : 'border-transparent opacity-70',
              )}
              aria-label={`View image ${idx + 1}`}
            >
              <GalleryImage image={img} alt="" variant="thumb" className={COVER_IMAGE_CLASS} />
              {idx === activeIndex && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <Check className="h-4 w-4 text-white" aria-hidden />
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>,
    document.body,
  );
}

interface GalleryProps {
  images: ListingImage[];
  title: string;
}

export function Gallery({ images, title }: GalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

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
      <AspectMediaFrame className="rounded-xl">
        <BrandMediaImage src={null} alt={`${title} — no photos`} rounded="lg" className="h-full w-full" />
      </AspectMediaFrame>
    );
  }

  const active = slides[activeIndex]!;

  return (
    <>
      <div className="space-y-3">
        <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          <AspectMediaFrame className="group cursor-zoom-in rounded-xl">
            <button
              type="button"
              className="absolute inset-0 z-0"
              onClick={() => setLightboxOpen(true)}
              aria-label="Open fullscreen gallery"
            >
              <GalleryImage
                image={active}
                alt={title}
                variant="card"
                className={cn(
                  COVER_IMAGE_CLASS,
                  'transition-transform duration-300 ease-out md:group-hover:scale-110',
                )}
              />
            </button>
            <span className="pointer-events-none absolute bottom-3 right-3 z-10 flex items-center gap-1 rounded-md bg-black/55 px-2 py-1 text-xs text-white md:opacity-0 md:transition-opacity md:group-hover:opacity-100">
              <ZoomIn className="h-3.5 w-3.5" aria-hidden />
              View all
            </span>
            {slides.length > 1 && (
              <>
                <span className="pointer-events-none absolute bottom-3 left-3 z-10 rounded-md bg-black/55 px-2 py-1 text-xs text-white">
                  {activeIndex + 1} / {slides.length}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    goPrev();
                  }}
                  className="absolute left-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 md:block"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    goNext();
                  }}
                  className="absolute right-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 md:block"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </AspectMediaFrame>
        </div>

        {slides.length > 1 && (
          <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1">
            {slides.map((img, idx) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setActiveIndex(idx)}
                className={cn(
                  'relative aspect-video w-20 shrink-0 overflow-hidden rounded-md border-2 sm:w-24',
                  idx === activeIndex ? 'border-primary' : 'border-transparent',
                )}
                aria-label={`View image ${idx + 1}`}
                aria-current={idx === activeIndex}
              >
                <GalleryImage image={img} alt="" variant="thumb" className={COVER_IMAGE_CLASS} />
                {idx === activeIndex && (
                  <span className="absolute inset-0 flex items-center justify-center bg-primary/20">
                    <Check className="h-4 w-4 text-primary" aria-hidden />
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <GalleryLightbox
        images={slides}
        title={title}
        activeIndex={activeIndex}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onIndexChange={setActiveIndex}
      />
    </>
  );
}
