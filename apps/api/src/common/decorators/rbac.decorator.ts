import { SetMetadata } from '@nestjs/common';

import type { PermissionCode, RbacRole } from '@community-marketplace/types';

export const REQUIRED_ROLES_KEY = 'rbac:requiredRoles';
export const REQUIRED_PERMISSIONS_KEY = 'rbac:requiredPermissions';
export const REQUIRED_ANY_PERMISSIONS_KEY = 'rbac:requiredAnyPermissions';

/** Require one of the listed roles (OR). User must be authenticated. */
export const RequireRole = (...roles: RbacRole[]) => SetMetadata(REQUIRED_ROLES_KEY, roles);

/** Require all listed permissions (AND). Supports per-user overrides via user_permissions. */
export const RequirePermissions = (...permissions: PermissionCode[]) =>
  SetMetadata(REQUIRED_PERMISSIONS_KEY, permissions);

/** Require at least one of the listed permissions (OR). */
export const RequireAnyPermission = (...permissions: PermissionCode[]) =>
  SetMetadata(REQUIRED_ANY_PERMISSIONS_KEY, permissions);

/**
 * @deprecated Use RequireRole — kept for gradual migration
 */
export const Roles = (...roles: RbacRole[]) => RequireRole(...roles);
