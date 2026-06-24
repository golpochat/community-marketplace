import { formatCurrency } from '@community-marketplace/utils';

import { ListingsTable } from '@/components/listings/listings-table';
import { adminServerService } from '@/services/admin.service.server';

export const metadata = { title: 'Listings' };

export default async function ListingsPage() {
  const listings = await adminServerService.getListings();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Listings</h1>
      <p className="mt-1 text-sm text-gray-600">
        {listings.length} listings — total value {formatCurrency(listings.reduce((s, l) => s + l.price, 0))}
      </p>
      <div className="mt-8">
        <ListingsTable listings={listings} />
      </div>
    </div>
  );
}
