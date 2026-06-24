import type { RbacRole } from '@community-marketplace/types';

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
  sellerDashboard: '/seller/dashboard',
  buyerDashboard: '/buyer/dashboard',
  login: '/auth/login',
  register: '/auth/register',
} as const;

const ROLE_DASHBOARD_PATHS: Partial<Record<RbacRole, string>> = {
  SELLER: WEB_APP_ROUTES.sellerDashboard,
  BUYER: WEB_APP_ROUTES.buyerDashboard,
};

export function getWebDashboardPathForRole(role: RbacRole): string {
  return ROLE_DASHBOARD_PATHS[role] ?? WEB_APP_ROUTES.buyerDashboard;
}

export function isWebDashboardRouteAllowed(role: RbacRole | null, pathname: string): boolean {
  if (!role) return false;
  if (pathname.startsWith('/seller/dashboard')) return role === 'SELLER';
  if (pathname.startsWith('/buyer/dashboard')) return role === 'BUYER';
  return false;
}
