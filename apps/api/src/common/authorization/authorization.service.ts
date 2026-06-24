import { Inject, Injectable } from '@nestjs/common';

import type { PermissionCode, RbacRole, UserEffectivePermissions } from '@community-marketplace/types';

import type { AuthenticatedUser } from '../decorators/current-user.decorator';
import { hasAllPermissions, hasAnyRole } from './domain/effective-permissions';
import {
  PERMISSION_RESOLVER,
  type PermissionResolverPort,
} from './ports/permission-resolver.port';

@Injectable()
export class AuthorizationService {
  constructor(
    @Inject(PERMISSION_RESOLVER)
    private readonly permissionResolver: PermissionResolverPort,
  ) {}

  resolveForUser(
    user: Pick<AuthenticatedUser, 'id' | 'role' | 'primaryRoleId'>,
  ): Promise<UserEffectivePermissions> {
    return this.permissionResolver.resolveForAuthenticatedUser(user);
  }

  async userHasAllPermissions(
    user: Pick<AuthenticatedUser, 'id' | 'role' | 'primaryRoleId'>,
    required: readonly PermissionCode[],
  ): Promise<boolean> {
    const resolved = await this.resolveForUser(user);
    return hasAllPermissions(resolved.effective, required);
  }

  userHasAnyRole(user: Pick<AuthenticatedUser, 'role'>, required: readonly RbacRole[]): boolean {
    return hasAnyRole(user.role, required);
  }
}
