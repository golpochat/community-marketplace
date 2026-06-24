import { formatCurrency } from '@community-marketplace/utils';

import { ListingCard } from '@/components/listings/listing-card';

export const metadata = { title: 'Listings' };

const PLACEHOLDER_LISTINGS = [
  { id: '1', title: 'Vintage Bicycle', price: 150, location: 'Downtown' },
  { id: '2', title: 'Office Desk', price: 80, location: 'Westside' },
  { id: '3', title: 'Garden Tools Set', price: 45, location: 'North Park' },
];

export default function ListingsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-gray-900">Browse Listings</h1>
      <p className="mt-2 text-gray-600">
        {PLACEHOLDER_LISTINGS.length} items — prices from{' '}
        {formatCurrency(Math.min(...PLACEHOLDER_LISTINGS.map((l) => l.price)))}
      </p>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {PLACEHOLDER_LISTINGS.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </div>
  );
}
