import Link from 'next/link';

import { Badge } from '@community-marketplace/ui';

import { Avatar } from '@/components/shared/avatar';

interface SellerCardProps {
  sellerId: string;
  sellerName?: string;
  sellerSlug?: string;
  verified?: boolean;
  memberSince?: string;
  location?: string;
}

export function SellerCard({
  sellerId,
  sellerName = 'Seller',
  sellerSlug,
  verified,
  memberSince,
  location,
}: SellerCardProps) {
  const storeHref = sellerSlug ? `/store/${sellerSlug}` : undefined;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <Avatar name={sellerName} size="lg" />
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-gray-900">{sellerName}</p>
            {verified && <Badge variant="secondary">Verified</Badge>}
          </div>
          {location && <p className="text-sm text-gray-500">{location}</p>}
          {memberSince && (
            <p className="text-xs text-gray-400">Member since {memberSince}</p>
          )}
        </div>
      </div>
      {storeHref && (
        <Link
          href={storeHref}
          className="mt-4 block text-center text-sm font-medium text-primary hover:underline"
        >
          Visit store →
        </Link>
      )}
      <p className="mt-2 text-xs text-gray-400">Seller ID: {sellerId}</p>
    </div>
  );
}
