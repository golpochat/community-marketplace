import { formatCurrency } from '@community-marketplace/utils';

interface Listing {
  id: string;
  title: string;
  price: number;
  location: string;
  status: string;
}

interface ListingsTableProps {
  listings: Listing[];
}

export function ListingsTable({ listings }: ListingsTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Title</th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Price</th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Location</th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {listings.map((listing) => (
            <tr key={listing.id}>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{listing.title}</td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                {formatCurrency(listing.price)}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">{listing.location}</td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">{listing.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
