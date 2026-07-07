import type { PermissionCode, RoleCodeValue } from '@community-marketplace/types';

export function hasPermission(
  permissions: PermissionCode[],
  role: RoleCodeValue | null | undefined,
  code: PermissionCode,
): boolean {
  if (role === 'SUPER_ADMIN') return true;
  return permissions.includes(code);
}

export function hasAnyPermission(
  permissions: PermissionCode[],
  role: RoleCodeValue | null | undefined,
  codes: PermissionCode[],
): boolean {
  if (role === 'SUPER_ADMIN') return true;
  return codes.some((code) => permissions.includes(code));
}
