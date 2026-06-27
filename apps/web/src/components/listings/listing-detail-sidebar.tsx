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
import { ListingDeliveryDisplay } from '@/components/listings/listing-delivery-display';
import { ListingPriceDisplay } from '@/components/listings/listing-price-display';
import { ListingTrustCues } from '@/components/listings/listing-trust-cues';
import { ReportButton } from '@/components/listings/report-button';
import { SaveButton } from '@/components/listings/save-button';
import { SellerCard } from '@/components/listings/seller-card';
import { ShareListingButton } from '@/components/listings/ShareListingButton';
import { useAuth } from '@/hooks/use-auth';
import { WEB_APP_ROUTES } from '@/lib/rbac-routes';

interface ListingDetailSidebarProps {
  listing: Listing;
  initialSaved?: boolean;
  compact?: boolean;
  hideActions?: boolean;
}

function formatResponseTime(minutes?: number): string | undefined {
  if (minutes == null || minutes <= 0) return undefined;
  if (minutes < 60) return `Typically responds within ${minutes} min`;
  const hours = Math.round(minutes / 60);
  return `Typically responds within ${hours} hr${hours === 1 ? '' : 's'}`;
}

function SidebarPanel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white p-4 shadow-brand-sm ${className ?? ''}`}
    >
      {children}
    </div>
  );
}

export function ListingDetailSidebar({
  listing,
  initialSaved,
  compact = false,
  hideActions = false,
}: ListingDetailSidebarProps) {
  const { isAuthenticated } = useAuth();
  const listedAt = resolveListingListedAt(listing.createdAt, listing.activatedAt);
  const showUpdated =
    listing.updatedAt &&
    new Date(listing.updatedAt).getTime() - new Date(listedAt).getTime() > 60_000;
  const deliveryOptions = listing.deliveryOptions ?? [];
  const seller = listing.seller;
  const responseHint = formatResponseTime(seller?.responseTimeMinutes);

  return (
    <aside className="space-y-3 lg:sticky lg:top-20 lg:self-start">
      {!compact && <BuyerProtectionBanner />}

      <SidebarPanel>
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
            <span>{formatLocationLabel(listing.location.label)}</span>
          </div>

          {deliveryOptions.length > 0 && (
            <ListingDeliveryDisplay options={deliveryOptions} inline title="Delivery" />
          )}
        </div>
      </SidebarPanel>

      <SidebarPanel className="space-y-4">
        <SellerCard
          seller={seller}
          sellerName={seller?.displayName?.trim() || 'Seller'}
          sellerSlug={seller?.storeSlug}
          verified={seller?.verified}
          memberSince={seller?.memberSince}
          location={listing.location.label}
          showCallButton={!hideActions}
          listingId={listing.id}
          compact
        />

        {responseHint && (
          <p className="border-t border-gray-100 pt-3 text-xs text-gray-600">{responseHint}</p>
        )}

        {!hideActions && (
          <div className="space-y-3 border-t border-gray-100 pt-4">
            <ChatButton listingId={listing.id} sellerId={listing.sellerId} />
            <div className="flex flex-wrap gap-2">
              <SaveButton listingId={listing.id} initialSaved={initialSaved} />
              <ShareListingButton listingId={listing.id} title={listing.title} />
              <ReportButton listingId={listing.id} />
            </div>
            {!isAuthenticated && (
              <p className="text-center text-xs text-gray-500">
                <Link href={WEB_APP_ROUTES.login} className="font-medium text-primary hover:underline">
                  Log in
                </Link>
                {' to contact this seller.'}
              </p>
            )}
          </div>
        )}
      </SidebarPanel>

      <SidebarPanel>
        <div className="space-y-1 text-xs text-gray-500">
          <p>{formatListedAgo(listedAt)}</p>
          {showUpdated && <p>{formatUpdatedAgo(listing.updatedAt)}</p>}
        </div>
        {!compact && <ListingTrustCues className="mt-4 border-t border-gray-100 pt-4" />}
      </SidebarPanel>
    </aside>
  );
}
