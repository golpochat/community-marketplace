import type {
  PermissionCode,
  RbacRole,
  UserEffectivePermissions,
} from '@community-marketplace/types';

export interface EffectivePermissionInput {
  userId: string;
  primaryRole: RbacRole;
  primaryRoleId: string;
  rolePermissions: PermissionCode[];
  grantedOverrides: PermissionCode[];
  deniedOverrides: PermissionCode[];
}

/** Pure resolver — portable to a standalone auth microservice */
export function computeEffectivePermissions(
  input: EffectivePermissionInput,
): UserEffectivePermissions {
  const effectiveSet = new Set(input.rolePermissions);

  for (const permission of input.grantedOverrides) {
    effectiveSet.add(permission);
  }

  for (const permission of input.deniedOverrides) {
    effectiveSet.delete(permission);
  }

  return {
    userId: input.userId,
    primaryRole: input.primaryRole,
    primaryRoleId: input.primaryRoleId,
    rolePermissions: [...input.rolePermissions],
    grantedOverrides: [...input.grantedOverrides],
    deniedOverrides: [...input.deniedOverrides],
    effective: [...effectiveSet],
  };
}

export function hasAllPermissions(
  effective: readonly PermissionCode[],
  required: readonly PermissionCode[],
): boolean {
  if (!required.length) {
    return true;
  }

  const effectiveSet = new Set(effective);
  return required.every((permission) => effectiveSet.has(permission));
}

export function hasAnyPermission(
  effective: readonly PermissionCode[],
  required: readonly PermissionCode[],
): boolean {
  if (!required.length) {
    return true;
  }

  const effectiveSet = new Set(effective);
  return required.some((permission) => effectiveSet.has(permission));
}

export function hasAnyRole(userRole: RbacRole, required: readonly RbacRole[]): boolean {
  if (!required.length) {
    return true;
  }

  return required.includes(userRole);
}
