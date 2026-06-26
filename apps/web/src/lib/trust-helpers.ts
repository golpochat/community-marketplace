import type { ListingSellerSummary } from '@community-marketplace/types';

export interface SellerTrustInput {
  verified?: boolean;
  phoneVerified?: boolean;
  memberSince?: string;
  soldCount?: number;
  averageRating?: number;
  reviewCount?: number;
  isAmbassador?: boolean;
  isBusiness?: boolean;
}

export function isNewMember(memberSince?: string): boolean {
  if (!memberSince) return false;
  const joined = new Date(memberSince);
  if (Number.isNaN(joined.getTime())) return false;
  const days = (Date.now() - joined.getTime()) / (1000 * 60 * 60 * 24);
  return days <= 30;
}

export function isTrustedSeller(averageRating?: number, reviewCount?: number): boolean {
  return (
    averageRating != null &&
    reviewCount != null &&
    reviewCount >= 5 &&
    averageRating >= 4.5
  );
}

export function isTopSeller(soldCount?: number): boolean {
  return (soldCount ?? 0) >= 10;
}

export function sellerTrustFromSummary(
  seller?: ListingSellerSummary,
  extras?: Partial<SellerTrustInput>,
): SellerTrustInput {
  return {
    verified: extras?.verified ?? seller?.verified,
    phoneVerified: extras?.phoneVerified ?? seller?.phoneVerified,
    memberSince: extras?.memberSince ?? seller?.memberSince,
    soldCount: extras?.soldCount ?? seller?.soldCount,
    averageRating: extras?.averageRating ?? seller?.averageRating,
    reviewCount: extras?.reviewCount ?? seller?.reviewCount,
    isAmbassador: extras?.isAmbassador ?? seller?.isAmbassador,
    isBusiness: extras?.isBusiness ?? seller?.isBusiness,
  };
}

export interface BuyerTrustInput {
  phoneVerified?: boolean;
  completedTransactions?: number;
  hasDisputes?: boolean;
  isCommunityMember?: boolean;
  averageRating?: number;
  reviewCount?: number;
}

export function isSafeBuyer(completedTransactions?: number, hasDisputes?: boolean): boolean {
  return (completedTransactions ?? 0) >= 3 && !hasDisputes;
}
