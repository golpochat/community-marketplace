'use client';

import Link from 'next/link';

import type { ListingSellerSummary } from '@community-marketplace/types';
import { Button } from '@community-marketplace/ui';
import { BadgeCheck, Phone } from 'lucide-react';

import { ListingBadge } from '@/components/listings/listing-badge';

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
  compact?: boolean;
  className?: string;
}

function formatMemberSince(iso?: string): string | undefined {
  if (!iso) return undefined;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toLocaleDateString('en-IE', { month: 'long', year: 'numeric' });
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
  compact = false,
  className,
}: SellerCardProps) {
  const name = seller?.displayName?.trim() || sellerName || 'Community seller';
  const joined = formatMemberSince(memberSince ?? seller?.memberSince);
  const storeHref = sellerSlug ? `/store/${sellerSlug}` : undefined;
  const activeCount = seller?.activeListingCount;
  const soldCount = seller?.soldCount;
  const phone = seller?.phone;
  const listingsHref = storeHref ?? (seller?.id ? `/listings?seller=${seller.id}` : undefined);
  const communityLabel = resolveCommunityLabel(location);
  const isVerified = verified ?? seller?.verified;

  return (
    <div className={className}>
      <div className="flex items-start gap-3">
        <Avatar name={name} size={compact ? 'md' : 'lg'} />
        <div className="min-w-0 flex-1 space-y-1.5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-foreground">{name}</p>
              {isVerified && (
                <ListingBadge tone="verified" className="font-normal">
                  <BadgeCheck className="h-3 w-3" aria-hidden />
                  Verified
                </ListingBadge>
              )}
            </div>
            {location && (
              <p className="text-sm text-muted-foreground">
                {location}
                {communityLabel && (
                  <span className="text-primary"> · {communityLabel}</span>
                )}
              </p>
            )}
          </div>

          <SellerRatingDisplay
            averageRating={seller?.averageRating}
            reviewCount={seller?.reviewCount}
            size={compact ? 'sm' : 'md'}
          />

          <SellerTrustBadges
            variant="compact"
            verified={false}
            phoneVerified={seller?.phoneVerified}
            memberSince={memberSince ?? seller?.memberSince}
            soldCount={soldCount}
            averageRating={seller?.averageRating}
            reviewCount={seller?.reviewCount}
            isAmbassador={seller?.isAmbassador}
            isBusiness={seller?.isBusiness}
          />

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {joined && <span>Member since {joined}</span>}
            {typeof activeCount === 'number' && listingsHref && (
              <Link
                href={listingsHref}
                className="font-medium text-primary hover:underline"
                {...(listingId ? { 'aria-label': `View ${activeCount} active listings from ${name}` } : {})}
              >
                {activeCount} active listing{activeCount === 1 ? '' : 's'}
              </Link>
            )}
            {typeof soldCount === 'number' && soldCount > 0 && (
              <span>{soldCount} sold</span>
            )}
          </div>
        </div>
      </div>

      {(showCallButton && phone) || storeHref ? (
        <div className={`grid gap-2 ${compact ? 'mt-3' : 'mt-4'} ${showCallButton && phone && storeHref ? 'sm:grid-cols-2' : ''}`}>
          {showCallButton && phone && (
            <a href={`tel:${phone}`} className={storeHref ? '' : 'block'}>
              <Button type="button" variant="outline" className="w-full" size={compact ? 'sm' : 'default'}>
                <Phone className="mr-2 h-4 w-4" aria-hidden />
                Call seller
              </Button>
            </a>
          )}
          {storeHref && (
            <Link href={storeHref} className={storeHref ? '' : 'block'}>
              <Button type="button" variant="outline" className="w-full" size={compact ? 'sm' : 'default'}>
                Visit store
              </Button>
            </Link>
          )}
        </div>
      ) : null}
    </div>
  );
}
