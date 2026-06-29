import type { SellerVerificationStatus } from '@community-marketplace/types';
import { SELLER_VERIFICATION_MESSAGES } from '@community-marketplace/types';

export type VerificationBannerType = 'info' | 'warning' | 'critical';

export type VerificationNudgeTier =
  | 'none'
  | 'first_listing'
  | 'third_listing'
  | 'one_left'
  | 'limit_reached'
  | 'verification_required'
  | 'under_review'
  | 'suspended';

export interface VerificationNudgeState {
  tier: VerificationNudgeTier;
  message: string;
  bannerType: VerificationBannerType;
  /** Banners may be dismissed; the hard-stop modal may not. */
  dismissible: boolean;
  showProgress: boolean;
  verifyHref: string;
  verifyLabel: string;
}

import { SELLER_ROUTES } from '@/lib/seller-routes';

const VERIFY_HREF = SELLER_ROUTES.verification;

export function resolveNudgeTier(
  count: number,
  limit: number,
): Exclude<VerificationNudgeTier, 'verification_required' | 'under_review' | 'suspended' | 'none'> | 'none' {
  if (count === 1) return 'first_listing';
  if (count === 3) return 'third_listing';
  if (count === limit - 1) return 'one_left';
  if (count >= limit) return 'limit_reached';
  return 'none';
}

export function resolveVerificationNudge(
  status: SellerVerificationStatus | null,
): VerificationNudgeState | null {
  if (!status || status.sellerStatus === 'verified') return null;

  if (status.sellerStatus === 'suspended') {
    return {
      tier: 'suspended',
      message:
        status.verificationRejectedReason ?? 'Your seller account is suspended.',
      bannerType: 'critical',
      dismissible: false,
      showProgress: false,
      verifyHref: VERIFY_HREF,
      verifyLabel: 'Contact support',
    };
  }

  if (status.sellerStatus === 'under_review') {
    return {
      tier: 'under_review',
      message: SELLER_VERIFICATION_MESSAGES.UNDER_REVIEW,
      bannerType: 'info',
      dismissible: false,
      showProgress: false,
      verifyHref: VERIFY_HREF,
      verifyLabel: 'View status',
    };
  }

  if (status.sellerStatus === 'verification_required') {
    return {
      tier: 'verification_required',
      message: SELLER_VERIFICATION_MESSAGES.BLOCK_VERIFICATION_REQUIRED,
      bannerType: 'critical',
      dismissible: false,
      showProgress: true,
      verifyHref: VERIFY_HREF,
      verifyLabel: 'Verify now',
    };
  }

  const tier = resolveNudgeTier(status.unverifiedListingCount, status.sellerLimit);
  const message =
    status.nudgeMessage ??
    (tier === 'first_listing'
      ? SELLER_VERIFICATION_MESSAGES.NUDGE_FIRST_LISTING
      : tier === 'third_listing'
        ? SELLER_VERIFICATION_MESSAGES.NUDGE_THIRD_LISTING
        : tier === 'one_left'
          ? SELLER_VERIFICATION_MESSAGES.NUDGE_ONE_LEFT
          : tier === 'limit_reached'
            ? SELLER_VERIFICATION_MESSAGES.NUDGE_LIMIT_REACHED
            : null);

  if (!message && tier === 'none') return null;

  const bannerType: VerificationBannerType =
    tier === 'limit_reached'
      ? 'warning'
      : tier === 'one_left'
        ? 'warning'
        : 'info';

  return {
    tier,
    message: message ?? 'Verify to unlock unlimited listings.',
    bannerType,
    dismissible: true,
    showProgress: true,
    verifyHref: VERIFY_HREF,
    verifyLabel: tier === 'first_listing' ? 'Start verification' : 'Verify now',
  };
}

const DISMISS_PREFIX = 'sellnearby:verification-nudge-dismissed';
const TOAST_SEEN_PREFIX = 'sellnearby:verification-nudge-toast-seen';

export function nudgeDismissStorageKey(userId: string, tier: VerificationNudgeTier): string {
  return `${DISMISS_PREFIX}:${userId}:${tier}`;
}

export function nudgeToastSeenStorageKey(userId: string, tier: VerificationNudgeTier): string {
  return `${TOAST_SEEN_PREFIX}:${userId}:${tier}`;
}

export function isNudgeBannerDismissed(userId: string, tier: VerificationNudgeTier): boolean {
  if (typeof window === 'undefined' || !tier || tier === 'verification_required') return false;
  try {
    return window.localStorage.getItem(nudgeDismissStorageKey(userId, tier)) === '1';
  } catch {
    return false;
  }
}

export function dismissNudgeBanner(userId: string, tier: VerificationNudgeTier): void {
  if (typeof window === 'undefined' || !tier || tier === 'verification_required') return;
  try {
    window.localStorage.setItem(nudgeDismissStorageKey(userId, tier), '1');
  } catch {
    // ignore quota errors
  }
}

export function hasSeenNudgeToast(userId: string, tier: VerificationNudgeTier): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return window.sessionStorage.getItem(nudgeToastSeenStorageKey(userId, tier)) === '1';
  } catch {
    return true;
  }
}

export function markNudgeToastSeen(userId: string, tier: VerificationNudgeTier): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(nudgeToastSeenStorageKey(userId, tier), '1');
  } catch {
    // ignore
  }
}
