import type { RbacRole, Role, UserEffectivePermissions, UserPermission } from './rbac';

export type { RbacRole, RoleCode, UserRole } from './rbac';

export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface User {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  /** FK to roles.id */
  primaryRoleId: string;
  /** Denormalized role code for API convenience */
  role: RbacRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile extends User {
  bio?: string;
  location?: string;
  phone?: string;
}

export interface UserWithRole extends User {
  /** Populated from `users.primary_role_id` → `roles`. */
  primaryRole?: Role;
}

export interface UserWithPermissions extends UserWithRole {
  permissionOverrides?: UserPermission[];
  effectivePermissions?: UserEffectivePermissions;
}
