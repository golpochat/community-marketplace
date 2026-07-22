'use client';

import Link from 'next/link';

import type { Listing } from '@community-marketplace/types';
import { cn } from '@community-marketplace/ui';
import { formatLocationLabel } from '@community-marketplace/utils';
import { MapPin } from 'lucide-react';

import { ChatButton } from '@/components/listings/chat-button';
import { BuyNowButton } from '@/components/listings/buy-now-button';
import { ListingReserveCta } from '@/components/listings/listing-reserve-cta';
import { BoostedBadge } from '@/components/listings/boosted-badge';
import { FeaturedBadge } from '@/components/listings/featured-badge';
import { ListingCashbackCue } from '@/components/listings/listing-cashback-cue';
import { ListingDeliveryDisplay } from '@/components/listings/listing-delivery-display';
import { ListingPriceDisplay } from '@/components/listings/listing-price-display';
import { ListingTrustCues } from '@/components/listings/listing-trust-cues';
import { ReportButton } from '@/components/listings/report-button';
import { SaveButton } from '@/components/listings/save-button';
import { SellerCard } from '@/components/listings/seller-card';
import { ShareListingButton } from '@/components/listings/ShareListingButton';
import { buildListingShareOgPreview } from '@/lib/listing-share-preview';
import { useAuth } from '@/hooks/use-auth';
import { WEB_APP_ROUTES } from '@/lib/rbac-routes';

interface ListingDetailSidebarProps {
  listing: Listing;
  initialSaved?: boolean;
  compact?: boolean;
  hideActions?: boolean;
  onListingChange?: (listing: Listing) => void;
}

function formatResponseTime(minutes?: number): string | undefined {
  if (minutes == null || minutes <= 0) return undefined;
  if (minutes < 60) return `Typically responds within ${minutes} min`;
  const hours = Math.round(minutes / 60);
  return `Typically responds within ${hours} hr${hours === 1 ? '' : 's'}`;
}

function SidebarSection({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn('p-4', className)}>{children}</div>;
}

export function ListingDetailSidebar({
  listing,
  initialSaved,
  compact = false,
  hideActions = false,
  onListingChange,
}: ListingDetailSidebarProps) {
  const { isAuthenticated } = useAuth();
  const deliveryOptions = listing.deliveryOptions ?? [];
  const seller = listing.seller;
  const responseHint = formatResponseTime(seller?.responseTimeMinutes);

  return (
    <aside className="lg:sticky lg:top-20 lg:self-start">
      <div className="surface-section overflow-hidden p-0">
        {/* 1. Price → location → fulfilment */}
        <SidebarSection className="border-b border-border">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <ListingPriceDisplay
              price={listing.price}
              originalPrice={listing.originalPrice}
              salePrice={listing.salePrice}
              discountPercent={listing.discountPercent}
              currency={listing.currency}
              size="detail"
              priceDroppedAt={listing.priceDroppedAt}
            />
            <div className="flex flex-wrap items-center gap-2">
              <FeaturedBadge featuredUntil={listing.featuredUntil} isFeatured={listing.isFeatured} />
              <BoostedBadge boostedUntil={listing.boostedUntil} />
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex items-start gap-2 text-sm text-foreground">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
              <span>{formatLocationLabel(listing.location.label)}</span>
            </div>

            {deliveryOptions.length > 0 && (
              <ListingDeliveryDisplay options={deliveryOptions} inline />
            )}
          </div>
        </SidebarSection>

        {/* 2. Primary actions: Buy → Message → Reserve */}
        {!hideActions && (
          <SidebarSection className="space-y-3 border-b border-border">
            <BuyNowButton listing={listing} />
            {!compact && <ListingCashbackCue listingId={listing.id} embedded />}
            <ChatButton listingId={listing.id} sellerId={listing.sellerId} />
            <ListingReserveCta
              listing={listing}
              onUpdated={(next) => onListingChange?.(next)}
            />
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <SaveButton
                listingId={listing.id}
                initialSaved={initialSaved}
                className="h-10"
              />
              <ShareListingButton
                listingId={listing.id}
                title={listing.title}
                linkPreview={buildListingShareOgPreview(listing)}
                className="h-10"
              />
              <ReportButton listingId={listing.id} className="h-10" />
            </div>
            {!isAuthenticated && (
              <p className="text-center text-xs text-muted-foreground">
                <Link href={WEB_APP_ROUTES.login} className="font-medium text-primary hover:underline">
                  Log in
                </Link>
                {' to contact this seller.'}
              </p>
            )}
          </SidebarSection>
        )}

        {/* 3. Compact seller (no repeated location) */}
        <SidebarSection className="space-y-3 border-b border-border">
          <SellerCard
            seller={seller}
            sellerName={seller?.displayName?.trim() || 'Seller'}
            sellerSlug={seller?.storeSlug}
            verified={seller?.verified}
            memberSince={seller?.memberSince}
            showCallButton={!hideActions}
            listingId={listing.id}
            compact
          />
          {responseHint && (
            <p className="text-xs text-muted-foreground">{responseHint}</p>
          )}
        </SidebarSection>

        {/* 4. Trust once */}
        {!compact && (
          <SidebarSection>
            <ListingTrustCues compact />
          </SidebarSection>
        )}
      </div>
    </aside>
  );
}
