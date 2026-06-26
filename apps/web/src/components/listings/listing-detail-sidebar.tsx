'use client';

import Link from 'next/link';

import type { Listing } from '@community-marketplace/types';
import {
  formatListedAgo,
  formatLocationLabel,
  formatUpdatedAgo,
  resolveListingListedAt,
} from '@community-marketplace/utils';
import { MapPin } from 'lucide-react';

import { ChatButton } from '@/components/listings/chat-button';
import { BuyerProtectionBanner } from '@/components/listings/buyer-protection-banner';
import { ListingDeliveryBadges } from '@/components/listings/listing-delivery-badges';
import { ListingPriceDisplay } from '@/components/listings/listing-price-display';
import { ListingBadge } from '@/components/listings/listing-badge';
import { ListingTrustCues } from '@/components/listings/listing-trust-cues';
import { ReportButton } from '@/components/listings/report-button';
import { SaveButton } from '@/components/listings/save-button';
import { SellerCard } from '@/components/listings/seller-card';
import { ShareListingButton } from '@/components/listings/ShareListingButton';
import { resolveCommunityLabel } from '@community-marketplace/utils';
import { useAuth } from '@/hooks/use-auth';
import { WEB_APP_ROUTES } from '@/lib/rbac-routes';

interface ListingDetailSidebarProps {
  listing: Listing;
  sellerDisplayName?: string;
  sellerSlug?: string;
  initialSaved?: boolean;
}

export function ListingDetailSidebar({
  listing,
  sellerDisplayName,
  sellerSlug,
  initialSaved,
}: ListingDetailSidebarProps) {
  const { isAuthenticated } = useAuth();
  const listedAt = resolveListingListedAt(listing.createdAt, listing.activatedAt);
  const showUpdated =
    listing.updatedAt &&
    new Date(listing.updatedAt).getTime() - new Date(listedAt).getTime() > 60_000;

  const deliveryOptions = listing.deliveryOptions ?? [];
  const communityLabel = resolveCommunityLabel(listing.location.label);

  return (
    <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
      <BuyerProtectionBanner />
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-brand-sm">
        <ListingPriceDisplay
          price={listing.price}
          originalPrice={listing.originalPrice}
          salePrice={listing.salePrice}
          discountPercent={listing.discountPercent}
          currency={listing.currency}
          size="detail"
          priceDroppedAt={listing.priceDroppedAt}
        />

        <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
          <div className="flex items-start gap-2 text-sm text-gray-700">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
            <div>
              <span>{formatLocationLabel(listing.location.label)}</span>
              {communityLabel && (
                <p className="mt-0.5 text-xs font-medium text-primary">{communityLabel}</p>
              )}
            </div>
          </div>

          {deliveryOptions.length > 0 && (
            <ListingDeliveryBadges options={deliveryOptions} />
          )}
        </div>
      </div>

      <SellerCard
        seller={listing.seller}
        sellerName={sellerDisplayName}
        sellerSlug={sellerSlug}
        verified={listing.seller?.verified}
        memberSince={listing.seller?.memberSince}
        location={listing.location.label}
        showCallButton
        listingId={listing.id}
      />

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-brand-sm">
        <div className="space-y-3">
          <ChatButton listingId={listing.id} sellerId={listing.sellerId} />
          <div className="flex flex-wrap gap-2">
            <SaveButton listingId={listing.id} initialSaved={initialSaved} />
            <ShareListingButton listingId={listing.id} title={listing.title} />
            <ReportButton listingId={listing.id} />
          </div>
        </div>

        {!isAuthenticated && (
          <p className="mt-4 border-t border-gray-100 pt-3 text-center text-xs text-gray-500">
            <Link href={WEB_APP_ROUTES.login} className="font-medium text-primary hover:underline">
              Log in
            </Link>
            {' to contact this seller.'}
          </p>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-brand-sm">
        <div className="space-y-1 text-xs text-gray-500">
          <p>{formatListedAgo(listedAt)}</p>
          {showUpdated && <p>{formatUpdatedAgo(listing.updatedAt)}</p>}
        </div>
        {listing.status === 'active' && (
          <ListingBadge tone="primary" className="mt-3 font-normal">
            Active listing
          </ListingBadge>
        )}
        <ListingTrustCues className="mt-4 border-t border-gray-100 pt-4" />
        <p className="mt-3 text-xs text-gray-500">
          <Link href="/safety" className="font-medium text-primary hover:underline">
            Safety &amp; scam protection
          </Link>
        </p>
      </div>
    </aside>
  );
}
