'use client';

import type { PermissionCode, RbacRole } from '@community-marketplace/types';

import { hasPermission } from '@/lib/permissions';
import { useAdminAuth } from '@/hooks/use-admin-auth';

export function usePermissions() {
  const { user, permissions } = useAdminAuth();

  const can = (code: PermissionCode) =>
    hasPermission(permissions, user?.role as RbacRole | null, code);

  return { permissions, can, role: user?.role ?? null };
}
