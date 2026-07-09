import {
  isAdminPanelRoleCode,
  type RbacRole,
  type RoleCodeValue,
} from '@community-marketplace/types';

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
  | 'shield';

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
    case 'SELLER':
      return {
        dashboard: dashboardPath,
        myListings: WEB_APP_ROUTES.sellerListings,
        messages: WEB_APP_ROUTES.sellerChat,
        notifications: WEB_APP_ROUTES.sellerNotifications,
        settings: '/seller/settings',
        sellItem: '/seller/listings/create',
      };
    case 'BUYER':
      return {
        dashboard: dashboardPath,
        myListings: WEB_APP_ROUTES.buyerPurchases,
        messages: WEB_APP_ROUTES.buyerChat,
        notifications: WEB_APP_ROUTES.buyerNotifications,
        settings: '/buyer/settings',
        sellItem: '/seller/listings/create',
        savedItems: '/buyer/favorites',
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

  if (role === 'SELLER') {
    return [
      { href: dashboardPath, label: 'Seller dashboard', icon: 'dashboard' },
      { href: WEB_APP_ROUTES.sellerListings, label: 'My listings', icon: 'list' },
      { href: WEB_APP_ROUTES.sellerChat, label: 'Messages', icon: 'messages' },
      { href: '/seller/settings', label: 'Settings', icon: 'settings' },
    ];
  }

  if (role === 'BUYER') {
    return [
      { href: dashboardPath, label: 'Buyer dashboard', icon: 'dashboard' },
      { href: WEB_APP_ROUTES.buyerPurchases, label: 'Purchases', icon: 'package' },
      { href: '/buyer/favorites', label: 'Saved items', icon: 'heart' },
      { href: WEB_APP_ROUTES.buyerChat, label: 'Messages', icon: 'messages' },
      { href: '/buyer/settings', label: 'Settings', icon: 'settings' },
    ];
  }

  return [
    { href: dashboardPath, label: 'Dashboard', icon: 'dashboard' },
    { href: WEB_APP_ROUTES.listings, label: 'Browse listings', icon: 'list' },
    { href: WEB_APP_ROUTES.chat, label: 'Messages', icon: 'messages' },
    { href: dashboardPath, label: 'Settings', icon: 'settings' },
  ];
}
