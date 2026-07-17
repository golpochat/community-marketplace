import type { PermissionCode } from '@community-marketplace/types';

import { PERMISSIONS } from '@community-marketplace/types';

import type { DashboardIconName } from '../ui/Icon';

export interface SidebarNavChildItem {
  id: string;
  label: string;
  href: string;
  permission?: PermissionCode;
}

export interface SidebarNavItem {
  id: string;
  label: string;
  href?: string;
  icon?: DashboardIconName;
  exact?: boolean;
  /** Non-interactive group label (e.g. Governance, Platform). */
  sectionHeader?: boolean;
  /** When set, item is shown only if the user has this permission (SUPER_ADMIN bypasses). */
  permission?: PermissionCode;
  children?: SidebarNavChildItem[];
  disabled?: boolean;
  disabledReason?: string;
}

export type SidebarLinkItem = SidebarNavItem & {
  href: string;
  icon: DashboardIconName;
};

export function isSidebarLinkItem(item: SidebarNavItem): item is SidebarLinkItem {
  return Boolean(item.href && item.icon && !item.sectionHeader);
}

type AdminRoutePrefix = '/admin' | '/super-admin';

export function getSellerVerificationSidebarChildren(
  routePrefix: AdminRoutePrefix,
): SidebarNavChildItem[] {
  return [
    {
      id: 'sv-pending',
      label: 'Pending Requests',
      href: `${routePrefix}/seller-verification/pending`,
    },
    {
      id: 'sv-under-review',
      label: 'Under Review',
      href: `${routePrefix}/seller-verification/under-review`,
    },
    {
      id: 'sv-approved',
      label: 'Approved',
      href: `${routePrefix}/seller-verification/approved`,
    },
    {
      id: 'sv-rejected',
      label: 'Rejected',
      href: `${routePrefix}/seller-verification/rejected`,
    },
    {
      id: 'sv-suspended',
      label: 'Suspended Sellers',
      href: `${routePrefix}/seller-verification/suspended`,
    },
    {
      id: 'sv-history',
      label: 'Status History',
      href: `${routePrefix}/seller-verification/history`,
    },
  ];
}

export const SELLER_VERIFICATION_SIDEBAR_CHILDREN = getSellerVerificationSidebarChildren('/admin');

export const SUPER_ADMIN_SIDEBAR: SidebarNavItem[] = [
  { id: 'overview', label: 'Overview', href: '/super-admin/dashboard', icon: 'crown', exact: true },

  { id: 'section-governance', label: 'Governance', sectionHeader: true },
  {
    id: 'platform-settings',
    label: 'Platform settings',
    href: '/super-admin/platform-settings',
    icon: 'settings',
  },
  { id: 'rbac', label: 'Roles & Permissions', href: '/super-admin/rbac', icon: 'user-cog' },
  { id: 'user-management', label: 'User management', href: '/super-admin/user-management', icon: 'users' },
  { id: 'audit-log', label: 'Audit Log', href: '/super-admin/audit-log', icon: 'scroll' },

  { id: 'section-trust', label: 'Trust & escalation', sectionHeader: true },
  {
    id: 'disputes',
    label: 'Disputes',
    href: '/super-admin/disputes',
    icon: 'scale',
    permission: PERMISSIONS.VIEW_DISPUTES,
  },
  {
    id: 'fraud',
    label: 'Fraud Detection',
    href: '/super-admin/fraud',
    icon: 'alert-triangle',
    permission: PERMISSIONS.VIEW_FRAUD,
  },
  {
    id: 'moderation-insights',
    label: 'Moderation insights',
    href: '/super-admin/moderation-insights',
    icon: 'flag',
    permission: PERMISSIONS.VIEW_PLATFORM_STATS,
  },

  { id: 'section-platform', label: 'Platform insight', sectionHeader: true },
  {
    id: 'platform-metrics',
    label: 'Platform metrics',
    href: '/super-admin/platform-metrics',
    icon: 'bar-chart',
    permission: PERMISSIONS.VIEW_PLATFORM_STATS,
  },
  {
    id: 'monetization',
    label: 'Listing promotions',
    href: '/super-admin/monetization',
    icon: 'tag',
    permission: PERMISSIONS.MANAGE_PAYMENTS,
  },
  {
    id: 'finance',
    label: 'Financial reports',
    href: '/super-admin/finance',
    icon: 'landmark',
    permission: PERMISSIONS.MANAGE_PAYMENTS,
  },
  {
    id: 'search',
    label: 'Search',
    href: '/super-admin/search',
    icon: 'compass',
    permission: PERMISSIONS.MANAGE_SEARCH_INDEX,
  },
];

export const ADMIN_SIDEBAR: SidebarNavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/admin/dashboard',
    icon: 'bar-chart',
    exact: true,
    permission: PERMISSIONS.VIEW_PLATFORM_STATS,
  },
  {
    id: 'users',
    label: 'Users',
    href: '/admin/users',
    icon: 'users',
    permission: PERMISSIONS.VIEW_USERS,
  },
  {
    id: 'seller-verification',
    label: 'Seller Verification',
    href: '/admin/seller-verification/pending',
    icon: 'shield-check',
    permission: PERMISSIONS.REVIEW_SELLER_VERIFICATION,
    children: SELLER_VERIFICATION_SIDEBAR_CHILDREN,
  },
  {
    id: 'listings',
    label: 'Listings',
    href: '/admin/listings',
    icon: 'folder',
    permission: PERMISSIONS.VIEW_LISTINGS,
  },
  {
    id: 'listing-moderation',
    label: 'Listing Moderation',
    href: '/admin/listing-moderation',
    icon: 'shield-check',
    permission: PERMISSIONS.APPROVE_LISTING,
  },
  {
    id: 'delivery-reviews',
    label: 'Delivery Reviews',
    href: '/admin/delivery-reviews',
    icon: 'package',
    permission: PERMISSIONS.MANAGE_LISTINGS,
  },
  {
    id: 'price-reviews',
    label: 'Price Reviews',
    href: '/admin/price-reviews',
    icon: 'tag',
    permission: PERMISSIONS.MANAGE_LISTINGS,
  },
  {
    id: 'moderation',
    label: 'Moderation',
    href: '/admin/moderation',
    icon: 'scale',
    permission: PERMISSIONS.VIEW_REPORTS,
  },
  {
    id: 'moderation-insights',
    label: 'Moderation insights',
    href: '/admin/moderation-insights',
    icon: 'flag',
    permission: PERMISSIONS.VIEW_PLATFORM_STATS,
  },
  {
    id: 'message-moderation',
    label: 'Message Reports',
    href: '/admin/message-moderation',
    icon: 'message-circle',
    permission: PERMISSIONS.MODERATE_MESSAGES,
  },
  {
    id: 'disputes',
    label: 'Disputes',
    href: '/admin/disputes',
    icon: 'scale',
    permission: PERMISSIONS.VIEW_DISPUTES,
  },
  {
    id: 'fraud',
    label: 'Fraud Detection',
    href: '/admin/fraud',
    icon: 'shield-check',
    permission: PERMISSIONS.VIEW_FRAUD,
  },
  {
    id: 'payments',
    label: 'Payments',
    href: '/admin/payments',
    icon: 'credit-card',
    permission: PERMISSIONS.VIEW_PAYMENTS,
  },
  {
    id: 'monetization',
    label: 'Listing promotions',
    href: '/admin/monetization',
    icon: 'landmark',
    permission: PERMISSIONS.MANAGE_PAYMENTS,
  },
  {
    id: 'finance',
    label: 'Financial reports',
    href: '/admin/finance',
    icon: 'bar-chart',
    permission: PERMISSIONS.MANAGE_PAYMENTS,
  },
  {
    id: 'search',
    label: 'Search Tools',
    href: '/admin/search',
    icon: 'compass',
    permission: PERMISSIONS.MANAGE_SEARCH_INDEX,
  },
  {
    id: 'notifications',
    label: 'Notifications',
    href: '/admin/notifications',
    icon: 'bell',
    permission: PERMISSIONS.MANAGE_NOTIFICATIONS,
  },
];

export const SELLER_SIDEBAR: SidebarNavItem[] = [
  { id: 'home', label: 'Home', href: '/account', icon: 'home', exact: true },
  { id: 'listings', label: 'My Listings', href: '/account/listings', icon: 'tag' },
  { id: 'create', label: 'Create Listing', href: '/account/listings/create', icon: 'plus' },
  { id: 'sales', label: 'Sales', href: '/account/earnings', icon: 'shopping-cart' },
  { id: 'disputes', label: 'Disputes', href: '/account/disputes', icon: 'scale' },
  { id: 'earnings', label: 'Earnings', href: '/account/earnings', icon: 'wallet' },
  { id: 'share-analytics', label: 'Share Analytics', href: '/account/earnings', icon: 'bar-chart' },
  { id: 'chat', label: 'Chat', href: '/account/messages', icon: 'message-circle' },
  { id: 'storefront', label: 'Storefront', href: '/account/storefront', icon: 'eye' },
  { id: 'verification', label: 'Verification', href: '/account/verification', icon: 'medal' },
  { id: 'notifications', label: 'Notifications', href: '/account/notifications', icon: 'bell' },
];

export const BUYER_SIDEBAR: SidebarNavItem[] = [
  { id: 'home', label: 'Home', href: '/account', icon: 'home', exact: true },
  { id: 'listings', label: 'Browse Listings', href: '/listings', icon: 'search' },
  { id: 'favorites', label: 'Favorites', href: '/account/saved', icon: 'heart' },
  { id: 'purchases', label: 'Purchases', href: '/account/purchases', icon: 'package' },
  { id: 'wallet', label: 'SellNearby Credit', href: '/account/wallet', icon: 'wallet' },
  { id: 'disputes', label: 'Disputes', href: '/account/disputes', icon: 'scale' },
  { id: 'chat', label: 'Chat', href: '/account/messages', icon: 'message-circle' },
  { id: 'notifications', label: 'Notifications', href: '/account/notifications', icon: 'bell' },
];

/** Unified marketplace account — buyer-first; seller items are injected per selling phase. */
export const ACCOUNT_SIDEBAR: SidebarNavItem[] = [
  { id: 'home', label: 'Account home', href: '/account', icon: 'home', exact: true },
  { id: 'browse', label: 'Browse listings', href: '/listings', icon: 'search' },
  { id: 'purchases', label: 'Purchases', href: '/account/purchases', icon: 'package' },
  { id: 'saved', label: 'Saved items', href: '/account/saved', icon: 'heart' },
  { id: 'messages', label: 'Messages', href: '/account/messages', icon: 'message-circle' },
  { id: 'disputes', label: 'Disputes', href: '/account/disputes', icon: 'scale' },
  { id: 'notifications', label: 'Notifications', href: '/account/notifications', icon: 'bell' },
  { id: 'settings', label: 'Settings', href: '/account/settings', icon: 'settings' },
];
