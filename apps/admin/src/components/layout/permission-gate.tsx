'use client';

import type { PermissionCode } from '@community-marketplace/types';

import { usePermissions } from '@/hooks/use-permissions';

interface PermissionGateProps {
  permission: PermissionCode;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGate({ permission, children, fallback = null }: PermissionGateProps) {
  const { can } = usePermissions();
  if (!can(permission)) return <>{fallback}</>;
  return <>{children}</>;
}
