'use client';

import { BadgeCheck } from 'lucide-react';

import { ListingBadge } from '@/components/listings/listing-badge';

interface ContactVerifiedBadgeProps {
  verified: boolean;
  /** Used for tooltips and screen readers, e.g. "Email" or "Phone". */
  label: string;
}

export function ContactVerifiedBadge({ verified, label }: ContactVerifiedBadgeProps) {
  if (verified) {
    return (
      <ListingBadge
        tone="verified"
        className="font-normal"
        title={`${label} verified`}
        aria-label={`${label} verified`}
      >
        <BadgeCheck className="h-3 w-3" aria-hidden />
        Verified
      </ListingBadge>
    );
  }

  return (
    <ListingBadge
      tone="outline"
      className="font-normal text-gray-500"
      title={`${label} not verified`}
      aria-label={`${label} not verified`}
    >
      Unverified
    </ListingBadge>
  );
}
