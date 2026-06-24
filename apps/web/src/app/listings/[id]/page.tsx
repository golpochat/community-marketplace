import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Button } from '@community-marketplace/ui';
import { formatCurrency } from '@community-marketplace/utils';

export const metadata = { title: 'Listing Details' };

const PLACEHOLDER_LISTINGS: Record<string, { title: string; price: number; location: string; description: string }> = {
  '1': { title: 'Vintage Bicycle', price: 150, location: 'Downtown', description: 'Well-maintained vintage bicycle in great condition.' },
  '2': { title: 'Office Desk', price: 80, location: 'Westside', description: 'Solid wood desk, perfect for home office.' },
  '3': { title: 'Garden Tools Set', price: 45, location: 'North Park', description: 'Complete set of garden tools.' },
};

interface ListingDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ListingDetailPage({ params }: ListingDetailPageProps) {
  const { id } = await params;
  const listing = PLACEHOLDER_LISTINGS[id];

  if (!listing) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/listings" className="text-sm text-primary hover:text-primary/90">
        ← Back to listings
      </Link>
      <h1 className="mt-4 text-3xl font-bold text-gray-900">{listing.title}</h1>
      <p className="mt-2 text-2xl font-semibold text-primary">{formatCurrency(listing.price)}</p>
      <p className="mt-1 text-sm text-gray-500">{listing.location}</p>
      <p className="mt-6 text-gray-700">{listing.description}</p>
      <div className="mt-8 flex gap-4">
        <Link href="/chat">
          <Button>Contact Seller</Button>
        </Link>
        <Button variant="secondary">Save</Button>
      </div>
    </div>
  );
}
