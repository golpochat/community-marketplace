import type { RbacRole } from '@community-marketplace/types';
import { canEnterSellerNamespace, isAdminPanelRoleCode } from '@community-marketplace/types';

import { WEB_APP_ROUTES } from '@/lib/rbac-routes';

/** Unified account messaging hub for marketplace roles. */
export function getAccountMessagesPath(): string {
  return WEB_APP_ROUTES.accountMessages;
}

export function buildListingMessageHref(listingId: string, sellerId: string): string {
  const params = new URLSearchParams({ listing: listingId, seller: sellerId });
  return `${getAccountMessagesPath()}?${params.toString()}`;
}

/** Chat UI/API namespace for thread creation and typing events. */
export type MarketplaceChatRole = 'BUYER' | 'SELLER' | 'MEMBER';

export function resolveMarketplaceChatRole(role: RbacRole | null | undefined): MarketplaceChatRole {
  if (role === 'SELLER') return 'SELLER';
  if (role === 'MEMBER') return 'MEMBER';
  return 'BUYER';
}

export function canInitiateListingThreadAsBuyer(
  role: MarketplaceChatRole,
  currentUserId: string,
  sellerId: string,
): boolean {
  if (currentUserId === sellerId) return false;
  return role === 'BUYER' || role === 'MEMBER';
}

export function resolveNotificationInboxRole(
  role: RbacRole | null | undefined,
): 'BUYER' | 'SELLER' | 'ADMIN' | 'SUPER_ADMIN' | null {
  if (!role) return null;
  if (role === 'MEMBER' || role === 'BUYER') return 'BUYER';
  if (role === 'SELLER') return 'SELLER';
  if (role === 'SUPER_ADMIN') return 'SUPER_ADMIN';
  // L2 personas (ACCOUNTS_ADMIN, etc.) use the shared admin inbox API.
  if (isAdminPanelRoleCode(role)) return 'ADMIN';
  return null;
}

export function isMarketplaceDashboardRole(role: RbacRole): boolean {
  return role === 'MEMBER' || role === 'BUYER' || canEnterSellerNamespace(role);
}
