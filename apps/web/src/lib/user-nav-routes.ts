import type { RbacRole, RoleCodeValue } from '@community-marketplace/types';
import { isAdminPanelRoleCode } from '@community-marketplace/types';

import { WEB_APP_ROUTES } from '@/lib/rbac-routes';

export interface UserNavLinks {
  dashboard: string;
  myListings: string;
  messages: string;
  notifications: string;
  settings: string;
  sellItem: string;
  savedItems?: string;
}

export type UserMenuIcon =
  | 'dashboard'
  | 'list'
  | 'messages'
  | 'heart'
  | 'package'
  | 'settings'
  | 'shield'
  | 'plus';

export interface UserMenuItem {
  href: string;
  label: string;
  icon: UserMenuIcon;
}

function resolveAdminNavLinks(dashboardPath: string): UserNavLinks {
  return {
    dashboard: dashboardPath,
    myListings: '/admin/listings',
    messages: '/admin/moderation',
    notifications: '/admin/notifications',
    settings: '/admin/settings',
    sellItem: '/seller/listings/create',
  };
}

export function getUserNavLinks(role: RoleCodeValue, dashboardPath: string): UserNavLinks {
  if (role === 'SUPER_ADMIN') {
    return {
      dashboard: dashboardPath,
      myListings: '/super-admin/listings',
      messages: '/super-admin/moderation',
      notifications: '/super-admin/notifications',
      settings: '/super-admin/settings',
      sellItem: '/seller/listings/create',
    };
  }

  if (isAdminPanelRoleCode(role)) {
    return resolveAdminNavLinks(dashboardPath);
  }

  switch (role as RbacRole) {
    case 'MEMBER':
    case 'BUYER':
    case 'SELLER':
      return {
        dashboard: dashboardPath,
        myListings: WEB_APP_ROUTES.accountListings,
        messages: WEB_APP_ROUTES.accountMessages,
        notifications: WEB_APP_ROUTES.accountNotifications,
        settings: WEB_APP_ROUTES.accountSettings,
        sellItem: '/account/listings/create',
        savedItems: WEB_APP_ROUTES.accountSaved,
      };
    default:
      return {
        dashboard: dashboardPath,
        myListings: WEB_APP_ROUTES.listings,
        messages: WEB_APP_ROUTES.chat,
        notifications: WEB_APP_ROUTES.buyerNotifications,
        settings: dashboardPath,
        sellItem: '/seller/listings/create',
      };
  }
}

/** Role-specific header dropdown entries (labels differ per persona). */
export function getUserMenuItems(role: RoleCodeValue, dashboardPath: string): UserMenuItem[] {
  if (role === 'SUPER_ADMIN') {
    return [
      { href: dashboardPath, label: 'Super Admin panel', icon: 'dashboard' },
      { href: '/super-admin/user-management', label: 'Operators & invites', icon: 'shield' },
      { href: '/super-admin/moderation', label: 'Moderation', icon: 'list' },
      { href: '/super-admin/notifications', label: 'Notifications', icon: 'messages' },
      { href: '/super-admin/settings', label: 'Settings', icon: 'settings' },
    ];
  }

  if (isAdminPanelRoleCode(role)) {
    return [
      { href: dashboardPath, label: 'Admin panel', icon: 'dashboard' },
      { href: '/admin/listings', label: 'Listings', icon: 'list' },
      { href: '/admin/moderation', label: 'Moderation', icon: 'shield' },
      { href: '/admin/notifications', label: 'Notifications', icon: 'messages' },
      { href: '/admin/settings', label: 'Settings', icon: 'settings' },
    ];
  }

  if (role === 'MEMBER' || role === 'BUYER' || role === 'SELLER') {
    return [
      { href: dashboardPath, label: 'Account home', icon: 'dashboard' },
      { href: WEB_APP_ROUTES.accountPurchases, label: 'Purchases', icon: 'package' },
      { href: WEB_APP_ROUTES.accountSaved, label: 'Saved items', icon: 'heart' },
      { href: WEB_APP_ROUTES.accountListings, label: 'My listings', icon: 'list' },
      { href: WEB_APP_ROUTES.accountStartSelling, label: 'Start selling', icon: 'plus' },
      { href: WEB_APP_ROUTES.accountMessages, label: 'Messages', icon: 'messages' },
      { href: WEB_APP_ROUTES.accountSettings, label: 'Settings', icon: 'settings' },
    ];
  }

  return [
    { href: dashboardPath, label: 'Dashboard', icon: 'dashboard' },
    { href: WEB_APP_ROUTES.listings, label: 'Browse listings', icon: 'list' },
    { href: WEB_APP_ROUTES.chat, label: 'Messages', icon: 'messages' },
    { href: dashboardPath, label: 'Settings', icon: 'settings' },
  ];
}
