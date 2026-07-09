'use client';

import { useCallback, useState } from 'react';

import { Button } from '@community-marketplace/ui';

import { ShareListingModal } from '@/components/listings/share-listing-modal';
import type { ListingShareOgPreview } from '@/lib/listing-share-preview';

interface ShareListingButtonProps {
  listingId: string;
  title: string;
  linkPreview?: ListingShareOgPreview;
  variant?: 'button' | 'icon';
  className?: string;
}

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.59 13.51 6.83 3.98" />
      <path d="m15.41 6.51-6.82 3.98" />
    </svg>
  );
}

export function ShareListingButton({
  listingId,
  title,
  linkPreview,
  variant = 'button',
  className,
}: ShareListingButtonProps) {
  const [open, setOpen] = useState(false);

  const handleClick = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setOpen(true);
  }, []);

  return (
    <>
      {variant === 'icon' ? (
        <button
          type="button"
          onClick={handleClick}
          className={`relative z-20 flex h-8 w-8 items-center justify-center rounded-full bg-card/90 text-foreground shadow-sm ring-1 ring-border transition-colors duration-150 hover:bg-card hover:text-primary ${className ?? ''}`}
          aria-label="Share listing"
        >
          <ShareIcon className="h-4 w-4" />
        </button>
      ) : (
        <Button type="button" variant="outline" onClick={handleClick} className={className}>
          Share
        </Button>
      )}
      <ShareListingModal
        listingId={listingId}
        title={title}
        linkPreview={linkPreview}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

export { ShareListingModal } from '@/components/listings/share-listing-modal';
