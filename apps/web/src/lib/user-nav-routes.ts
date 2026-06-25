import type { RbacRole } from '@community-marketplace/types';

import { WEB_APP_ROUTES } from '@/lib/rbac-routes';

export interface UserNavLinks {
  dashboard: string;
  myListings: string;
  messages: string;
  notifications: string;
  settings: string;
  sellItem: string;
}

export function getUserNavLinks(role: RbacRole, dashboardPath: string): UserNavLinks {
  switch (role) {
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
        myListings: WEB_APP_ROUTES.buyerListings,
        messages: WEB_APP_ROUTES.buyerChat,
        notifications: WEB_APP_ROUTES.buyerNotifications,
        settings: '/buyer/settings',
        sellItem: '/seller/listings/create',
      };
    case 'ADMIN':
      return {
        dashboard: dashboardPath,
        myListings: '/admin/listings',
        messages: '/admin/dashboard',
        notifications: '/admin/notifications',
        settings: '/admin/settings',
        sellItem: '/seller/listings/create',
      };
    case 'SUPER_ADMIN':
      return {
        dashboard: dashboardPath,
        myListings: '/super-admin/listings',
        messages: '/super-admin/dashboard',
        notifications: '/super-admin/notifications',
        settings: '/super-admin/settings',
        sellItem: '/seller/listings/create',
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
