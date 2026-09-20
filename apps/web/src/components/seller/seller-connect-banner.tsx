'use client';

import Link from 'next/link';

import { isSellerVerified } from '@community-marketplace/types';
import { shouldNudgeSellerConnect, CONNECT_NUDGE_MIN_LISTING_PRICE_EUR } from '@community-marketplace/utils';

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
  const { connect, loading: connectLoading, isReady } = useSellerConnectStatus({
    enabled: sellerVerified,
  });

  const priceOk =
    listingPriceEur == null ? true : shouldNudgeSellerConnect(listingPriceEur);

  if (verificationLoading || !sellerVerified || connectLoading || isReady || !priceOk) return null;

  return (
    <div
      className={`rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 ${className ?? ''}`}
      role="status"
    >
      <p className="font-medium">Set up payouts to receive card payments</p>
      <p className="mt-1 text-amber-900/90">
        {connect
          ? `Your Stripe account is not ready yet. Complete onboarding so buyers can pay for listings at €${CONNECT_NUDGE_MIN_LISTING_PRICE_EUR} or more.`
          : `Connect your bank account via Stripe so buyers can pay by card on listings at €${CONNECT_NUDGE_MIN_LISTING_PRICE_EUR} or more.`}
      </p>
      <Link
        href="/account/earnings"
        className="mt-2 inline-block font-medium text-amber-950 underline hover:no-underline"
      >
        Go to earnings &amp; Stripe Connect →
      </Link>
    </div>
  );
}
