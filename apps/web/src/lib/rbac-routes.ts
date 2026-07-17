import type { RbacRole, RoleCodeValue } from '@community-marketplace/types';
import { ACCOUNT_DASHBOARD_PATH, getLoginRedirectPath, isAdminPanelRoleCode } from '@community-marketplace/types';
import { canActAsBuyer, canEnterSellerNamespace } from '@community-marketplace/types';

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
  chat: '/account/messages',
  account: ACCOUNT_DASHBOARD_PATH,
  accountPurchases: '/account/purchases',
  accountSaved: '/account/saved',
  accountListings: '/account/listings',
  accountMessages: '/account/messages',
  accountEarnings: '/account/earnings',
  accountNotifications: '/account/notifications',
  accountStartSelling: '/account/start-selling',
  accountSelling: '/account/selling',
  accountStorefront: '/account/storefront',
  accountVerification: '/account/verification',
  accountSettings: '/account/settings',
  accountDisputes: '/account/disputes',
  accountWallet: '/account/wallet',
  accountListingsCreate: '/account/listings/create',
  /** @deprecated Use account* routes — kept as aliases during migration. */
  buyerChat: '/account/messages',
  buyerPurchases: '/account/purchases',
  buyerNotifications: '/account/notifications',
  buyerListings: '/listings',
  sellerChat: '/account/messages',
  sellerEarnings: '/account/earnings',
  sellerNotifications: '/account/notifications',
  sellerListings: '/account/listings',
  sellerDashboard: '/account',
  buyerDashboard: '/account',
  login: '/auth/login',
  register: '/auth/register',
  registerSeller: '/auth/register?intent=seller',
} as const;

const ROLE_DASHBOARD_PATHS: Partial<Record<RbacRole, string>> = {
  SUPER_ADMIN: '/super-admin/dashboard',
  ADMIN: '/admin/dashboard',
  MEMBER: ACCOUNT_DASHBOARD_PATH,
  SELLER: ACCOUNT_DASHBOARD_PATH,
  BUYER: ACCOUNT_DASHBOARD_PATH,
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
  if (pathname.startsWith('/account')) {
    return canActAsBuyer(role as RbacRole) || canEnterSellerNamespace(role as RbacRole);
  }
  if (pathname.startsWith('/seller')) return canEnterSellerNamespace(role as RbacRole);
  if (pathname.startsWith('/buyer')) return canActAsBuyer(role as RbacRole);
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
