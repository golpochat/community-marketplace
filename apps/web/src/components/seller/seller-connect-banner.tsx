'use client';

import Link from 'next/link';

import { useSellerConnectStatus } from '@/hooks/use-seller-connect-status';

interface SellerConnectBannerProps {
  className?: string;
}

export function SellerConnectBanner({ className }: SellerConnectBannerProps) {
  const { connect, loading, isReady } = useSellerConnectStatus();

  if (loading || isReady) return null;

  return (
    <div
      className={`rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 ${className ?? ''}`}
      role="status"
    >
      <p className="font-medium">Set up payouts to receive payments</p>
      <p className="mt-1 text-amber-900/90">
        {connect
          ? 'Your Stripe account is not ready yet. Complete onboarding so buyers can pay for your listings.'
          : 'Connect your bank account via Stripe before buyers can purchase your listings.'}
      </p>
      <Link
        href="/seller/earnings"
        className="mt-2 inline-block font-medium text-amber-950 underline hover:no-underline"
      >
        Go to earnings &amp; Stripe Connect →
      </Link>
    </div>
  );
}
