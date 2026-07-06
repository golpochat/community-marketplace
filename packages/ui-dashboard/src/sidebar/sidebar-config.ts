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
export const SUPER_ADMIN_SELLER_VERIFICATION_SIDEBAR_CHILDREN =
  getSellerVerificationSidebarChildren('/super-admin');

/** Break-glass ops tools — delegated to ADMIN day-to-day; reachable for super-admin escalation. */
export const SUPER_ADMIN_OPS_ESCALATION_CHILDREN: SidebarNavChildItem[] = [
  {
    id: 'ops-listing-moderation',
    label: 'Listing Moderation',
    href: '/super-admin/listing-moderation',
    permission: PERMISSIONS.APPROVE_LISTING,
  },
  {
    id: 'ops-moderation',
    label: 'Moderation',
    href: '/super-admin/moderation',
    permission: PERMISSIONS.VIEW_REPORTS,
  },
  {
    id: 'ops-message-moderation',
    label: 'Message Reports',
    href: '/super-admin/message-moderation',
    permission: PERMISSIONS.MODERATE_MESSAGES,
  },
  {
    id: 'ops-verifications',
    label: 'Account Verifications',
    href: '/super-admin/verifications',
    permission: PERMISSIONS.APPROVE_VERIFICATION,
  },
  {
    id: 'ops-listings',
    label: 'Listings',
    href: '/super-admin/listings',
    permission: PERMISSIONS.VIEW_LISTINGS,
  },
  { id: 'ops-delivery-reviews', label: 'Delivery Reviews', href: '/super-admin/delivery-reviews' },
  { id: 'ops-price-reviews', label: 'Price Reviews', href: '/super-admin/price-reviews' },
  {
    id: 'ops-payments',
    label: 'Payments',
    href: '/super-admin/payments',
    permission: PERMISSIONS.VIEW_PAYMENTS,
  },
  { id: 'ops-monetization', label: 'Listing promotions', href: '/super-admin/monetization' },
];

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
  { id: 'invitations', label: 'Invitations', href: '/super-admin/invitations', icon: 'mail' },
  { id: 'admins', label: 'Admins', href: '/super-admin/admins', icon: 'key' },
  { id: 'audit-log', label: 'Audit Log', href: '/super-admin/audit-log', icon: 'scroll' },

  { id: 'section-trust', label: 'Trust & escalation', sectionHeader: true },
  { id: 'users', label: 'Users', href: '/super-admin/users', icon: 'users' },
  {
    id: 'seller-verification',
    label: 'Seller Verification',
    href: '/super-admin/seller-verification/pending',
    icon: 'shield-check',
    permission: PERMISSIONS.REVIEW_SELLER_VERIFICATION,
    children: SUPER_ADMIN_SELLER_VERIFICATION_SIDEBAR_CHILDREN,
  },
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

  { id: 'section-platform', label: 'Platform insight', sectionHeader: true },
  { id: 'analytics', label: 'Analytics', href: '/super-admin/analytics', icon: 'bar-chart' },
  {
    id: 'finance',
    label: 'Financial reports',
    href: '/super-admin/finance',
    icon: 'landmark',
    permission: PERMISSIONS.MANAGE_PAYMENTS,
  },
  { id: 'search', label: 'Search', href: '/super-admin/search', icon: 'compass' },

  { id: 'section-ops', label: 'Operations escalation', sectionHeader: true },
  {
    id: 'ops-escalation',
    label: 'Ops tools',
    href: '/super-admin/listing-moderation',
    icon: 'hammer',
    children: SUPER_ADMIN_OPS_ESCALATION_CHILDREN,
  },
];

export const ADMIN_SIDEBAR: SidebarNavItem[] = [
  { id: 'dashboard', label: 'Dashboard', href: '/admin/dashboard', icon: 'bar-chart', exact: true },
  { id: 'users', label: 'Users', href: '/admin/users', icon: 'users' },
  { id: 'verifications', label: 'Account Verifications', href: '/admin/verifications', icon: 'medal' },
  { id: 'seller-verification', label: 'Seller Verification', href: '/admin/seller-verification/pending', icon: 'shield-check', permission: PERMISSIONS.REVIEW_SELLER_VERIFICATION, children: SELLER_VERIFICATION_SIDEBAR_CHILDREN },
  { id: 'listings', label: 'Listings', href: '/admin/listings', icon: 'folder' },
  {
    id: 'listing-moderation',
    label: 'Listing Moderation',
    href: '/admin/listing-moderation',
    icon: 'shield-check',
    permission: PERMISSIONS.APPROVE_LISTING,
  },
  { id: 'delivery-reviews', label: 'Delivery Reviews', href: '/admin/delivery-reviews', icon: 'package' },
  { id: 'price-reviews', label: 'Price Reviews', href: '/admin/price-reviews', icon: 'tag' },
  { id: 'moderation', label: 'Moderation', href: '/admin/moderation', icon: 'scale' },
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
  { id: 'payments', label: 'Payments', href: '/admin/payments', icon: 'credit-card' },
  { id: 'monetization', label: 'Listing promotions', href: '/admin/monetization', icon: 'landmark' },
  { id: 'finance', label: 'Financial reports', href: '/admin/finance', icon: 'bar-chart', permission: PERMISSIONS.MANAGE_PAYMENTS },
  { id: 'search', label: 'Search Tools', href: '/admin/search', icon: 'compass' },
  { id: 'notifications', label: 'Notifications', href: '/admin/notifications', icon: 'bell' },
];

export const SELLER_SIDEBAR: SidebarNavItem[] = [
  { id: 'home', label: 'Home', href: '/seller/dashboard', icon: 'home', exact: true },
  { id: 'listings', label: 'My Listings', href: '/seller/listings', icon: 'tag' },
  { id: 'create', label: 'Create Listing', href: '/seller/listings/create', icon: 'plus' },
  { id: 'sales', label: 'Sales', href: '/seller/sales', icon: 'shopping-cart' },
  { id: 'disputes', label: 'Disputes', href: '/seller/disputes', icon: 'scale' },
  { id: 'earnings', label: 'Earnings', href: '/seller/earnings', icon: 'wallet' },
  { id: 'share-analytics', label: 'Share Analytics', href: '/seller/analytics/shares', icon: 'bar-chart' },
  { id: 'chat', label: 'Chat', href: '/seller/chat', icon: 'message-circle' },
  { id: 'storefront', label: 'Storefront', href: '/seller/storefront', icon: 'eye' },
  { id: 'verification', label: 'Verification', href: '/seller/verification', icon: 'medal' },
  { id: 'notifications', label: 'Notifications', href: '/seller/notifications', icon: 'bell' },
];

export const BUYER_SIDEBAR: SidebarNavItem[] = [
  { id: 'home', label: 'Home', href: '/buyer/dashboard', icon: 'home', exact: true },
  { id: 'listings', label: 'Browse Listings', href: '/buyer/listings', icon: 'search' },
  { id: 'favorites', label: 'Favorites', href: '/buyer/favorites', icon: 'heart' },
  { id: 'purchases', label: 'Purchases', href: '/buyer/purchases', icon: 'package' },
  { id: 'wallet', label: 'SellNearby Credit', href: '/buyer/wallet', icon: 'wallet' },
  { id: 'disputes', label: 'Disputes', href: '/buyer/disputes', icon: 'scale' },
  { id: 'chat', label: 'Chat', href: '/buyer/chat', icon: 'message-circle' },
  { id: 'notifications', label: 'Notifications', href: '/buyer/notifications', icon: 'bell' },
];
