import type { PermissionCode, RbacRole } from '@community-marketplace/types';
import { PERMISSIONS } from '@community-marketplace/types';

import { getAdminDashboardBaseForRole } from './rbac-routes';

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon?: string;
  /** Required permission — SUPER_ADMIN bypasses */
  permission?: PermissionCode;
  /** Only visible to SUPER_ADMIN */
  superAdminOnly?: boolean;
  exact?: boolean;
}

export function buildAdminNav(role: RbacRole, permissions: PermissionCode[]): NavItem[] {
  const base = getAdminDashboardBaseForRole(role);
  const can = (code?: PermissionCode) =>
    !code || role === 'SUPER_ADMIN' || permissions.includes(code);

  const items: NavItem[] = [
    { id: 'overview', label: 'Overview', href: base, exact: true, permission: PERMISSIONS.VIEW_PLATFORM_STATS },
    { id: 'users', label: 'Users', href: `${base}/users`, permission: PERMISSIONS.VIEW_USERS },
    { id: 'verifications', label: 'Verifications', href: `${base}/verifications`, permission: PERMISSIONS.APPROVE_VERIFICATION },
    { id: 'listings', label: 'Listings', href: `${base}/listings`, permission: PERMISSIONS.VIEW_LISTINGS },
    { id: 'moderation', label: 'Moderation', href: `${base}/moderation`, permission: PERMISSIONS.VIEW_REPORTS },
    { id: 'payments', label: 'Payments', href: `${base}/payments`, permission: PERMISSIONS.VIEW_PAYMENTS },
    { id: 'notifications', label: 'Notifications', href: `${base}/notifications`, permission: PERMISSIONS.MANAGE_NOTIFICATIONS },
    { id: 'search', label: 'Search', href: `${base}/search`, permission: PERMISSIONS.MANAGE_SEARCH_INDEX },
    { id: 'analytics', label: 'Analytics', href: `${base}/analytics`, permission: PERMISSIONS.VIEW_PLATFORM_STATS },
    { id: 'audit', label: 'Audit Log', href: `${base}/audit`, permission: PERMISSIONS.VIEW_AUDIT_LOG },
    { id: 'rbac', label: 'RBAC', href: `${base}/rbac`, superAdminOnly: true },
    { id: 'admins', label: 'Admins', href: `${base}/admins`, superAdminOnly: true, permission: PERMISSIONS.MANAGE_ADMINS },
    { id: 'settings', label: 'Settings', href: `${base}/settings`, superAdminOnly: true },
  ];

  return items.filter((item) => {
    if (item.superAdminOnly && role !== 'SUPER_ADMIN') return false;
    return can(item.permission);
  });
}

/** Route → required permission for server guard */
export const ROUTE_PERMISSIONS: Record<string, PermissionCode | undefined> = {
  users: PERMISSIONS.VIEW_USERS,
  verifications: PERMISSIONS.APPROVE_VERIFICATION,
  listings: PERMISSIONS.VIEW_LISTINGS,
  moderation: PERMISSIONS.VIEW_REPORTS,
  payments: PERMISSIONS.VIEW_PAYMENTS,
  notifications: PERMISSIONS.MANAGE_NOTIFICATIONS,
  search: PERMISSIONS.MANAGE_SEARCH_INDEX,
  analytics: PERMISSIONS.VIEW_PLATFORM_STATS,
  audit: PERMISSIONS.VIEW_AUDIT_LOG,
  rbac: PERMISSIONS.MANAGE_ROLES,
  admins: PERMISSIONS.MANAGE_ADMINS,
  settings: PERMISSIONS.MANAGE_PLATFORM_PERMISSIONS,
};
