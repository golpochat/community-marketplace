import type { RbacRole } from './rbac';
import type { SellerStatus } from './seller-verification';
import type { SellerBusinessStructure } from './verification';

/** Marketplace roles — legacy BUYER/SELLER remain during migration. */
export const MARKETPLACE_ROLES = ['MEMBER', 'BUYER', 'SELLER'] as const;

export type MarketplaceRole = (typeof MARKETPLACE_ROLES)[number];

/** Unified account selling lifecycle for navigation and onboarding UX. */
export type AccountSellingPhase = 'buyer_only' | 'setup_in_progress' | 'active_seller' | 'suspended';

export interface SellerOnboardingSnapshot {
  started: boolean;
  startedAt: string | null;
  sellerStatus: SellerStatus | string;
  businessStructure: SellerBusinessStructure | string | null;
  isBusinessAccount?: boolean;
  businessName?: string | null;
  /** True when the seller has at least one Store row (required before listings). */
  hasStorefront: boolean;
  storeCount: number;
}

export function isMarketplaceRole(role: string): role is MarketplaceRole {
  return (MARKETPLACE_ROLES as readonly string[]).includes(role);
}

/** Default post-login hub for unified marketplace accounts. */
export const ACCOUNT_DASHBOARD_PATH = '/account';

export const ACCOUNT_SELLING_PATH = '/account/selling';

/**
 * True when seller identity/KYC has been submitted or approved.
 * Default `unverified` after opt-in alone does not count as complete.
 */
export function isSellerIdentityStepComplete(
  sellerStatus: SellerStatus | string | null | undefined,
): boolean {
  return sellerStatus === 'verified' || sellerStatus === 'under_review';
}

/**
 * Derives sidebar and dashboard UX phase from seller onboarding snapshot.
 * Storefront unlocks listing tools. Verification alone does not.
 */
export function deriveAccountSellingPhase(
  snapshot: SellerOnboardingSnapshot | null | undefined,
): AccountSellingPhase {
  if (!snapshot) return 'buyer_only';
  if (snapshot.sellerStatus === 'suspended') return 'suspended';
  if (snapshot.hasStorefront) return 'active_seller';
  if (snapshot.started) return 'setup_in_progress';
  return 'buyer_only';
}

/** True when the user may use buyer checkout, purchases, and favourites. */
export function canActAsBuyer(role: RbacRole): boolean {
  return role === 'MEMBER' || role === 'BUYER' || role === 'SELLER';
}

/** True when role may enter seller API namespaces (capability checks still apply for MEMBER). */
export function canEnterSellerNamespace(role: RbacRole): boolean {
  return role === 'MEMBER' || role === 'SELLER';
}

/** Legacy SELLER accounts, or MEMBER who completed seller onboarding. */
export function hasLegacySellerRole(role: RbacRole): boolean {
  return role === 'SELLER';
}

/** Whether seller listing tools belong in primary navigation. */
export function shouldShowSellerNavItems(phase: AccountSellingPhase): boolean {
  return phase === 'active_seller' || phase === 'suspended';
}
