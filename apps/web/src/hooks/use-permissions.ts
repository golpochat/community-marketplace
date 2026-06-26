'use client';

import type { PermissionCode } from '@community-marketplace/types';

import { useAuth } from '@/hooks/use-auth';
import { useUserProfile } from '@/hooks/use-user-profile';
import { hasAnyPermission, hasPermission } from '@/lib/permissions';

export function usePermissions() {
  const { user } = useAuth();
  const { permissions, loading } = useUserProfile();
  const effective = permissions?.effective ?? [];

  const can = (code: PermissionCode) =>
    hasPermission(effective, user?.role, code);

  const canAny = (codes: PermissionCode[]) =>
    hasAnyPermission(effective, user?.role, codes);

  return {
    permissions: effective,
    role: user?.role ?? null,
    loading,
    can,
    canAny,
  };
}
