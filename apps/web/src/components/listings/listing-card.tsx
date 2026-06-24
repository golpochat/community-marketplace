import Link from 'next/link';

import { Badge } from '@community-marketplace/ui';
import type { ListingSummary } from '@community-marketplace/types';
import { formatCurrency } from '@community-marketplace/utils';

interface ListingCardProps {
  listing: ListingSummary;
}

export function ListingCard({ listing }: ListingCardProps) {
  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group block overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-[4/3] bg-gray-100">
        {listing.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.imageUrl}
            alt={listing.title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">No image</div>
        )}
        <Badge className="absolute right-2 top-2 capitalize" variant="secondary">
          {listing.condition.replace('_', ' ')}
        </Badge>
      </div>
      <div className="p-4">
        <h2 className="line-clamp-2 font-semibold text-gray-900">{listing.title}</h2>
        <p className="mt-1 text-lg font-medium text-primary">
          {formatCurrency(listing.price, listing.currency)}
        </p>
        <p className="mt-1 text-sm text-gray-500">{listing.location.label}</p>
      </div>
    </Link>
  );
}
