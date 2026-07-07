import type { RbacRole, RoleCodeValue } from '@community-marketplace/types';
import { getLoginRedirectPath, isAdminPanelRoleCode } from '@community-marketplace/types';

/** Backend API path prefixes (after /api) */
export const API_NAMESPACES = {
  SUPER_ADMIN: '/super-admin',
  ADMIN: '/admin',
  SELLER: '/seller',
  BUYER: '/buyer',
} as const;

export const WEB_APP_ROUTES = {
  home: '/',
  listings: '/listings',
  chat: '/chat',
  buyerChat: '/buyer/chat',
  buyerPurchases: '/buyer/purchases',
  buyerNotifications: '/buyer/notifications',
  buyerListings: '/buyer/listings',
  sellerChat: '/seller/chat',
  sellerEarnings: '/seller/earnings',
  sellerNotifications: '/seller/notifications',
  sellerListings: '/seller/listings',
  sellerDashboard: '/seller/dashboard',
  buyerDashboard: '/buyer/dashboard',
  login: '/auth/login',
  register: '/auth/register',
} as const;

const ROLE_DASHBOARD_PATHS: Partial<Record<RbacRole, string>> = {
  SUPER_ADMIN: '/super-admin/dashboard',
  ADMIN: '/admin/dashboard',
  SELLER: WEB_APP_ROUTES.sellerDashboard,
  BUYER: WEB_APP_ROUTES.buyerDashboard,
};

export function getWebDashboardPathForRole(role: RoleCodeValue): string {
  if (isAdminPanelRoleCode(role)) return '/admin/dashboard';
  if (role in ROLE_DASHBOARD_PATHS) {
    return ROLE_DASHBOARD_PATHS[role as RbacRole] ?? getLoginRedirectPath(role as RbacRole);
  }
  return getLoginRedirectPath(role as RbacRole);
}

export function isWebDashboardRouteAllowed(role: RoleCodeValue | null, pathname: string): boolean {
  if (!role) return false;
  if (pathname.startsWith('/super-admin')) return role === 'SUPER_ADMIN';
  if (pathname.startsWith('/admin')) return isAdminPanelRoleCode(role);
  if (pathname.startsWith('/seller')) return role === 'SELLER';
  if (pathname.startsWith('/buyer')) return role === 'BUYER';
  return false;
}

export function isAuthRoute(pathname: string): boolean {
  return pathname === WEB_APP_ROUTES.login || pathname.startsWith('/auth/');
}

export function isAuthLoginRoute(pathname: string): boolean {
  return pathname === WEB_APP_ROUTES.login;
}

export function isAuthRegisterRoute(pathname: string): boolean {
  return pathname === WEB_APP_ROUTES.register;
}
