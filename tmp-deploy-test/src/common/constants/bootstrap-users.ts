import { ForbiddenException } from '@nestjs/common';

import { DEV_BOOTSTRAP_USER_IDS } from '../../database/dev-users.seed.data';

export { DEV_BOOTSTRAP_USER_IDS };

export function isBootstrapSuperAdmin(userId: string): boolean {
  return userId === DEV_BOOTSTRAP_USER_IDS.SUPER_ADMIN;
}

/** The seeded SUPER_ADMIN is singleton — cannot be suspended, banned, deleted, or reassigned. */
export function assertBootstrapSuperAdminImmutable(userId: string): void {
  if (isBootstrapSuperAdmin(userId)) {
    throw new ForbiddenException(
      'The bootstrap SUPER_ADMIN account is immutable and cannot be modified or removed',
    );
  }
}

/** SUPER_ADMIN accounts are seed-only — never assign via API. */
export function assertSuperAdminRoleNotAssignable(roleCode: string): void {
  if (roleCode === 'SUPER_ADMIN') {
    throw new ForbiddenException(
      'SUPER_ADMIN accounts cannot be created or assigned via the API',
    );
  }
}
