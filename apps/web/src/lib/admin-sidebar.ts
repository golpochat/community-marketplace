'use client';

import { PERMISSIONS, type PermissionCode, type RbacRole } from '@community-marketplace/types';
import {
  ADMIN_SIDEBAR,
  SUPER_ADMIN_SIDEBAR,
  type SidebarNavItem,
} from '@community-marketplace/ui-dashboard';

import { hasPermission } from '@/lib/permissions';

export function filterSidebarItems(
  role: RbacRole,
  permissions: PermissionCode[],
): SidebarNavItem[] {
  const items = role === 'SUPER_ADMIN' ? SUPER_ADMIN_SIDEBAR : ADMIN_SIDEBAR;

  return items
    .filter((item) => {
      if (item.sectionHeader) return true;
      if (!item.permission) return true;
      return hasPermission(permissions, role, item.permission);
    })
    .map((item) => {
      if (!item.children?.length) return item;
      return {
        ...item,
        children: item.children.filter((child) => {
          const required = child.permission ?? item.permission;
          if (!required) return true;
          return hasPermission(permissions, role, required);
        }),
      };
    });
}

export function canReviewSellerVerification(
  role: RbacRole | null | undefined,
  permissions: PermissionCode[],
): boolean {
  return hasPermission(permissions, role, PERMISSIONS.REVIEW_SELLER_VERIFICATION);
}

export function canViewSellerDocuments(
  role: RbacRole | null | undefined,
  permissions: PermissionCode[],
): boolean {
  return hasPermission(permissions, role, PERMISSIONS.VIEW_SELLER_DOCUMENTS);
}

export function canSuspendSeller(
  role: RbacRole | null | undefined,
  permissions: PermissionCode[],
): boolean {
  return hasPermission(permissions, role, PERMISSIONS.SUSPEND_SELLER);
}

export function canReactivateSeller(
  role: RbacRole | null | undefined,
  permissions: PermissionCode[],
): boolean {
  return hasPermission(permissions, role, PERMISSIONS.REACTIVATE_SELLER);
}

export function canForceReverifySeller(
  role: RbacRole | null | undefined,
  permissions: PermissionCode[],
): boolean {
  return hasPermission(permissions, role, PERMISSIONS.FORCE_REVERIFY_SELLER);
}

export function canManageSellerLimits(
  role: RbacRole | null | undefined,
  permissions: PermissionCode[],
): boolean {
  return hasPermission(permissions, role, PERMISSIONS.MANAGE_SELLER_LIMITS);
}
