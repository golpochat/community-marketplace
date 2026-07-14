import type { RbacRole } from './rbac';

/** Marketplace roles — legacy BUYER/SELLER remain during migration. */
export const MARKETPLACE_ROLES = ['MEMBER', 'BUYER', 'SELLER'] as const;

export type MarketplaceRole = (typeof MARKETPLACE_ROLES)[number];

export function isMarketplaceRole(role: string): role is MarketplaceRole {
  return (MARKETPLACE_ROLES as readonly string[]).includes(role);
}

/** Default post-login hub for unified marketplace accounts. */
export const ACCOUNT_DASHBOARD_PATH = '/account';

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
