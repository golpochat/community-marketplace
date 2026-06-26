'use client';

import { VerificationProgressBar } from './verification/verification-progress-bar';

interface SellerVerificationProgressProps {
  count: number;
  limit: number;
  className?: string;
}

/** @deprecated Use VerificationProgressBar with `used` prop. */
export function SellerVerificationProgress({
  count,
  limit,
  className,
}: SellerVerificationProgressProps) {
  return <VerificationProgressBar used={count} limit={limit} className={className} />;
}

export { VerificationProgressBar };
