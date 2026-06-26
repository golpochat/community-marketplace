'use client';

import { useEffect, useState } from 'react';

import type { SellerVerificationStatus } from '@community-marketplace/types';
import { SELLER_VERIFICATION_MESSAGES } from '@community-marketplace/types';

import { sellerVerificationService } from '@/services/seller-verification.service';

/** True when the seller cannot create a new listing (all Case A–D block conditions). */
export function isListingCreationBlocked(status: SellerVerificationStatus | null): boolean {
  if (!status) return false;
  if (
    status.sellerStatus === 'verification_required' ||
    status.sellerStatus === 'suspended' ||
    status.sellerStatus === 'under_review'
  ) {
    return true;
  }
  if (
    status.sellerStatus !== 'verified' &&
    status.unverifiedListingCount >= status.sellerLimit
  ) {
    return true;
  }
  return false;
}

/** Duplicate counts as a new listing toward the unverified limit. */
export function isDuplicateListingBlocked(status: SellerVerificationStatus | null): boolean {
  return isListingCreationBlocked(status);
}

export function isSellerSuspended(status: SellerVerificationStatus | null): boolean {
  return status?.sellerStatus === 'suspended';
}

export function listingGateTooltip(status: SellerVerificationStatus | null): string {
  if (!status) return SELLER_VERIFICATION_MESSAGES.BLOCK_VERIFICATION_REQUIRED;
  if (status.sellerStatus === 'suspended') {
    return status.verificationRejectedReason ?? 'Your seller account is suspended.';
  }
  if (status.sellerStatus === 'under_review') {
    return SELLER_VERIFICATION_MESSAGES.UNDER_REVIEW;
  }
  return SELLER_VERIFICATION_MESSAGES.BLOCK_VERIFICATION_REQUIRED;
}

export function listingGateBlockMessage(status: SellerVerificationStatus | null): string {
  return listingGateTooltip(status);
}

export function useSellerListingGate() {
  const [status, setStatus] = useState<SellerVerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void sellerVerificationService
      .getStatus()
      .then((data) => {
        if (!cancelled) setStatus(data);
      })
      .catch(() => {
        if (!cancelled) setStatus(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const blocked = isListingCreationBlocked(status);
  const duplicateBlocked = isDuplicateListingBlocked(status);
  const suspended = isSellerSuspended(status);

  return {
    status,
    loading,
    blocked,
    duplicateBlocked,
    suspended,
    listingActionsBlocked: suspended,
    tooltip: listingGateTooltip(status),
    blockMessage: listingGateBlockMessage(status),
  };
}
