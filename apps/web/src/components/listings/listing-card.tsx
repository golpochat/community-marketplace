import Link from 'next/link';

import { formatCurrency } from '@community-marketplace/utils';

interface ListingCardProps {
  listing: {
    id: string;
    title: string;
    price: number;
    location: string;
  };
}

export function ListingCard({ listing }: ListingCardProps) {
  return (
    <Link
      href={`/listings/${listing.id}`}
      className="block rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="mb-4 flex h-32 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
        No image
      </div>
      <h2 className="font-semibold text-gray-900">{listing.title}</h2>
      <p className="mt-1 text-lg font-medium text-primary">{formatCurrency(listing.price)}</p>
      <p className="mt-1 text-sm text-gray-500">{listing.location}</p>
    </Link>
  );
}
