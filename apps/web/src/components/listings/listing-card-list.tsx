'use client';

import type { ListingSummary } from '@community-marketplace/types';

import { ListingCard } from '@/components/listings/listing-card';

interface ListingCardListProps {
  listing: ListingSummary;
  showSave?: boolean;
  initialSaved?: boolean;
  className?: string;
  showTrust?: boolean;
}

/** List-layout browse card — thin wrapper around unified ListingCard. */
export function ListingCardList({
  listing,
  showSave = false,
  initialSaved,
  className,
  showTrust = false,
}: ListingCardListProps) {
  return (
    <ListingCard
      listing={listing}
      layout="list"
      showSave={showSave}
      initialSaved={initialSaved}
      showTrust={showTrust}
      className={className}
    />
  );
}
