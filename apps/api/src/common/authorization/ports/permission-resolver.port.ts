import type { UserEffectivePermissions } from '@community-marketplace/types';

import type { AuthenticatedUser } from '../../decorators/current-user.decorator';

/** Injection token — swap implementation for microservice HTTP client later */
export const PERMISSION_RESOLVER = Symbol('PERMISSION_RESOLVER');

export interface PermissionResolverPort {
  resolveForAuthenticatedUser(
    user: Pick<AuthenticatedUser, 'id' | 'role' | 'primaryRoleId'>,
  ): Promise<UserEffectivePermissions>;
}
