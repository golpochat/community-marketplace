'use client';

import { VerifiedSellerIcon } from '@/components/trust/verified-seller-icon';

interface ChatVerificationBadgeProps {
  verified: boolean;
  /** @deprecated Unused — kept for call-site compatibility. */
  role?: string;
}

export function ChatVerificationBadge({ verified }: ChatVerificationBadgeProps) {
  if (!verified) return null;
  return <VerifiedSellerIcon size="md" />;
}
