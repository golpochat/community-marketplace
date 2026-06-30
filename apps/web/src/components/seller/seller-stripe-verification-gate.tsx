'use client';

import Link from 'next/link';

import { SELLER_VERIFICATION_MESSAGES } from '@community-marketplace/types';

import { SELLER_ROUTES } from '@/lib/seller-routes';

interface SellerStripeVerificationGateProps {
  className?: string;
}

export function SellerStripeVerificationGate({ className }: SellerStripeVerificationGateProps) {
  return (
    <div
      className={`rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 ${className ?? ''}`}
      role="status"
    >
      <p className="font-medium">Seller verification required</p>
      <p className="mt-1 text-amber-900/90">
        {SELLER_VERIFICATION_MESSAGES.STRIPE_REQUIRES_VERIFICATION}
      </p>
      <Link
        href={SELLER_ROUTES.verification}
        className="mt-2 inline-block font-medium text-amber-950 underline hover:no-underline"
      >
        Continue verification →
      </Link>
    </div>
  );
}
