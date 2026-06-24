import type { PermissionCode, RbacRole } from '@community-marketplace/types';

export function hasPermission(
  permissions: PermissionCode[],
  role: RbacRole | null | undefined,
  code: PermissionCode,
): boolean {
  if (role === 'SUPER_ADMIN') return true;
  return permissions.includes(code);
}

export function hasAnyPermission(
  permissions: PermissionCode[],
  role: RbacRole | null | undefined,
  codes: PermissionCode[],
): boolean {
  return codes.some((code) => hasPermission(permissions, role, code));
}
