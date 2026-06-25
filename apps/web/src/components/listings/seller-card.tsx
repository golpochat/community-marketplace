import Link from 'next/link';

import { Badge } from '@community-marketplace/ui';
import type { ListingSellerSummary } from '@community-marketplace/types';

import { Avatar } from '@/components/shared/avatar';

interface SellerCardProps {
  seller?: ListingSellerSummary;
  sellerName?: string;
  sellerSlug?: string;
  verified?: boolean;
  memberSince?: string;
  location?: string;
}

function formatMemberSince(iso?: string): string | undefined {
  if (!iso) return undefined;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

export function SellerCard({
  seller,
  sellerName,
  sellerSlug,
  verified,
  memberSince,
  location,
}: SellerCardProps) {
  const name = seller?.displayName?.trim() || sellerName || 'Community seller';
  const isVerified = verified ?? seller?.verified ?? false;
  const joined = formatMemberSince(memberSince ?? seller?.memberSince);
  const storeHref = sellerSlug ? `/store/${sellerSlug}` : undefined;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <Avatar name={name} size="lg" />
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-gray-900">{name}</p>
            {isVerified && <Badge variant="secondary">Verified</Badge>}
          </div>
          {location && <p className="text-sm text-gray-500">{location}</p>}
          {joined && <p className="text-xs text-gray-400">Member since {joined}</p>}
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
    </div>
  );
}
