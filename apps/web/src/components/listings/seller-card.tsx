'use client';

import Link from 'next/link';

import type { ListingSellerSummary } from '@community-marketplace/types';
import { Button } from '@community-marketplace/ui';
import { Phone } from 'lucide-react';

import { ReportUserButton } from '@/components/listings/report-user-button';
import { Avatar } from '@/components/shared/avatar';
import { SellerRatingDisplay } from '@/components/trust/seller-rating-display';
import { SellerTrustBadges } from '@/components/trust/seller-trust-badges';
import { resolveCommunityLabel } from '@community-marketplace/utils';

interface SellerCardProps {
  seller?: ListingSellerSummary;
  sellerName?: string;
  sellerSlug?: string;
  verified?: boolean;
  memberSince?: string;
  location?: string;
  showCallButton?: boolean;
  listingId?: string;
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
  showCallButton = false,
  listingId,
}: SellerCardProps) {
  const name = seller?.displayName?.trim() || sellerName || 'Community seller';
  const joined = formatMemberSince(memberSince ?? seller?.memberSince);
  const storeHref = sellerSlug ? `/store/${sellerSlug}` : undefined;
  const activeCount = seller?.activeListingCount;
  const soldCount = seller?.soldCount;
  const phone = seller?.phone;
  const listingsHref = storeHref ?? (seller?.id ? `/listings?seller=${seller.id}` : undefined);
  const communityLabel = resolveCommunityLabel(location);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-brand-sm">
      <div className="flex items-start gap-3">
        <Avatar name={name} size="lg" />
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <p className="font-semibold text-gray-900">{name}</p>
            {location && <p className="text-sm text-gray-500">{location}</p>}
            {communityLabel && (
              <p className="text-xs font-medium text-primary">{communityLabel}</p>
            )}
          </div>

          <SellerRatingDisplay
            averageRating={seller?.averageRating}
            reviewCount={seller?.reviewCount}
            size="md"
          />

          <SellerTrustBadges
            verified={verified ?? seller?.verified}
            phoneVerified={seller?.phoneVerified}
            memberSince={memberSince ?? seller?.memberSince}
            soldCount={soldCount}
            averageRating={seller?.averageRating}
            reviewCount={seller?.reviewCount}
            isAmbassador={seller?.isAmbassador}
            isBusiness={seller?.isBusiness}
          />

          {joined && <p className="text-xs text-gray-500">Member since {joined}</p>}
          {typeof activeCount === 'number' && listingsHref && (
            <Link
              href={listingsHref}
              className="block text-xs font-medium text-primary hover:underline"
              {...(listingId ? { 'aria-label': `View ${activeCount} active listings from ${name}` } : {})}
            >
              {activeCount} active listing{activeCount === 1 ? '' : 's'}
            </Link>
          )}
          {typeof soldCount === 'number' && soldCount > 0 && (
            <p className="text-xs text-gray-500">{soldCount} item{soldCount === 1 ? '' : 's'} sold</p>
          )}
        </div>
      </div>

      {showCallButton && phone && (
        <a href={`tel:${phone}`} className="mt-4 block">
          <Button type="button" variant="outline" className="w-full">
            <Phone className="mr-2 h-4 w-4" aria-hidden />
            Call seller
          </Button>
        </a>
      )}

      {storeHref && (
        <Link
          href={storeHref}
          className="mt-4 block text-center text-sm font-medium text-primary hover:underline"
        >
          Visit store →
        </Link>
      )}

      {seller?.id && (
        <div className="mt-3 text-center">
          <ReportUserButton userId={seller.id} userName={name} variant="link" />
        </div>
      )}
    </div>
  );
}
