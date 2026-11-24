'use client';

import Link from 'next/link';

import { isSellerVerified } from '@community-marketplace/types';
import {
  shouldNudgeSellerConnect,
  CONNECT_NUDGE_MIN_LISTING_PRICE_EUR,
  COMMERCE_PUBLIC_COPY,
} from '@community-marketplace/utils';

import { useSellerConnectStatus } from '@/hooks/use-seller-connect-status';
import { useSellerListingGate } from '@/hooks/use-seller-listing-gate';

interface SellerConnectBannerProps {
  className?: string;
  /** Highest listed price in EUR among the listings in view. */
  listingPriceEur?: number;
}

export function SellerConnectBanner({ className, listingPriceEur }: SellerConnectBannerProps) {
  const { status, loading: verificationLoading } = useSellerListingGate();
  const sellerVerified = isSellerVerified(status?.sellerStatus);
  const { connect, loading: connectLoading, isCardCheckoutReady } = useSellerConnectStatus({
    enabled: sellerVerified,
  });

  const priceOk =
    listingPriceEur == null ? true : shouldNudgeSellerConnect(listingPriceEur);

  if (verificationLoading || !sellerVerified || connectLoading || isCardCheckoutReady || !priceOk) {
    return null;
  }

  const body = COMMERCE_PUBLIC_COPY.connectNudgeBody.replace(
    '{minPrice}',
    String(CONNECT_NUDGE_MIN_LISTING_PRICE_EUR),
  );

  return (
    <div
      className={`rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 ${className ?? ''}`}
      role="status"
    >
      <p className="font-medium">{COMMERCE_PUBLIC_COPY.connectNudgeTitle}</p>
      <p className="mt-1 text-amber-900/90">
        {connect
          ? `Your Stripe account is not ready yet. ${body}`
          : body}
      </p>
      <Link
        href="/account/earnings#connect"
        className="mt-2 inline-block font-medium text-amber-950 underline hover:no-underline"
      >
        Open Earnings — finish payout setup →
      </Link>
    </div>
  );
}
